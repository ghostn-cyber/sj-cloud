const http = require('http');
const url = require('url');
const { RuntimeContext } = require('../context/runtime-context');
const { extractOrCreateContext } = require('../tracing/tracer');
const { globalBreakerManager } = require('../circuit-breaker/breaker');
const { globalLoadBalancer } = require('../load-balancer/balancer');
const { calculateBackoff, isEligibleForRetry } = require('../retry/policy');
const { globalMetrics } = require('../telemetry/metrics');

class RoutingEngine {
  /**
   * @param {RuntimeCache} runtimeCache Reference to active runtime cache
   */
  constructor(runtimeCache) {
    this.runtimeCache = runtimeCache;
  }

  /**
   * Resolve destination and route the incoming client request
   * @param {http.IncomingMessage} clientReq
   * @param {http.ServerResponse} clientRes
   */
  async routeRequest(clientReq, clientRes) {
    const startTime = Date.now();
    
    // 1. Resolve destination service from host header
    const hostHeader = clientReq.headers['host'] || '';
    // hostHeader might be "auth" or "auth:80" or "auth.sj-services" etc.
    const serviceId = hostHeader.split(':')[0].split('.')[0].toLowerCase();
    
    const config = this.runtimeCache.getService(serviceId);
    if (!config) {
      console.warn(`Routing Engine: Service not found for host "${hostHeader}" (parsed: "${serviceId}")`);
      clientRes.statusCode = 404;
      clientRes.setHeader('Content-Type', 'application/json');
      return clientRes.end(JSON.stringify({ error: `Service not found: ${serviceId}` }));
    }

    // 2. Extract tenant and correlation identifiers
    const tenantId = clientReq.headers['x-tenant-id'] || 'system';
    const sourceService = clientReq.headers['x-source-service'] || 'api-gateway';
    const requestId = clientReq.headers['x-request-id'] || `req-${Math.random().toString(36).substr(2, 9)}`;
    const correlationId = clientReq.headers['x-correlation-id'] || requestId;

    // 3. Extract/init tracing context
    const tracingContext = extractOrCreateContext(clientReq.headers);

    // 4. Construct RuntimeContext
    const runtimeCtx = new RuntimeContext({
      tenantId,
      domain: hostHeader,
      requestId,
      correlationId,
      sourceService,
      destinationService: serviceId,
      routingPolicy: config.routing,
      timeoutPolicy: config.timeouts,
      retryPolicy: config.retry,
      circuitBreakerPolicy: config.circuit_breaker,
      securityPolicy: config.security,
      loadBalancerPolicy: config.load_balancer,
      traceId: tracingContext.traceId,
      spanId: tracingContext.spanId,
      parentSpanId: tracingContext.parentSpanId
    });

    // 5. Evaluate Security Policy
    const allowed = runtimeCtx.policies.security.allowed_sources || [];
    if (allowed.length > 0 && !allowed.includes(sourceService)) {
      clientRes.statusCode = 403;
      clientRes.setHeader('Content-Type', 'application/json');
      return clientRes.end(JSON.stringify({ error: `Access denied from service: ${sourceService}` }));
    }

    // 6. Evaluate Circuit Breaker
    const breaker = globalBreakerManager.getBreaker(serviceId, runtimeCtx.policies.circuitBreaker);
    if (!breaker.allowRequest()) {
      runtimeCtx.observability.circuitBreakerTripped = true;
      globalMetrics.recordRequest(tenantId, sourceService, serviceId, '503', 0);
      clientRes.statusCode = 503;
      clientRes.setHeader('Content-Type', 'application/json');
      clientRes.setHeader('X-Circuit-Breaker', 'Open');
      return clientRes.end(JSON.stringify({ error: `Service unavailable: circuit breaker for "${serviceId}" is open` }));
    }

    // 7. Resolve target endpoints
    const k8sPort = config.kubernetes.port || 80;
    const defaultEndpoint = `http://${config.routing.container_name}:${k8sPort}`;
    const endpoints = config.routing.endpoints || [defaultEndpoint];

    // 8. Execute Routing and Retry Loop
    const maxAttempts = runtimeCtx.policies.retry.max_attempts || 3;
    let attempt = 1;
    let lastError = null;
    let responseSent = false;

    while (attempt <= maxAttempts) {
      runtimeCtx.observability.attempts = attempt;
      
      // Select endpoint via Load Balancer
      let selectedEndpoint;
      try {
        selectedEndpoint = globalLoadBalancer.selectEndpoint(
          serviceId,
          runtimeCtx.policies.loadBalancer,
          endpoints,
          // Could pass in active statuses if tracked
        );
      } catch (err) {
        breaker.recordFailure();
        clientRes.statusCode = 502;
        return clientRes.end(JSON.stringify({ error: err.message }));
      }

      runtimeCtx.observability.targetInstance = selectedEndpoint;
      globalLoadBalancer.incrementConnections(selectedEndpoint);

      try {
        console.log(`Routing: Attempt ${attempt}/${maxAttempts} for "${serviceId}" to ${selectedEndpoint} (Path: ${clientReq.url})`);
        
        const childCtx = runtimeCtx.createChild(require('crypto').randomBytes(8).toString('hex'));
        const result = await this.executeHttpRequest(selectedEndpoint, clientReq, childCtx);
        
        globalLoadBalancer.decrementConnections(selectedEndpoint);

        // Success / Handled Response
        if (result.statusCode < 500) {
          breaker.recordSuccess();
          
          const duration = Date.now() - startTime;
          globalMetrics.recordRequest(tenantId, sourceService, serviceId, result.statusCode.toString(), duration);

          // Copy headers and write body
          for (const [k, v] of Object.entries(result.headers)) {
            clientRes.setHeader(k, v);
          }
          clientRes.statusCode = result.statusCode;
          clientRes.write(result.body);
          clientRes.end();
          
          responseSent = true;
          break;
        } else {
          // 5xx is treated as a service failure by the mesh policy
          throw new Error(`HTTPError:${result.statusCode}`);
        }
      } catch (err) {
        globalLoadBalancer.decrementConnections(selectedEndpoint);
        breaker.recordFailure();
        lastError = err;
        runtimeCtx.observability.failures.push(err.message);

        console.error(`Routing: Attempt ${attempt} failed: ${err.message}`);

        // Check if retry is eligible
        const eligible = isEligibleForRetry(clientReq.method, runtimeCtx.policies.retry);
        const hasBudget = (Date.now() - startTime) < runtimeCtx.policies.timeout.request_ms;
        
        if (eligible && hasBudget && attempt < maxAttempts) {
          const delay = calculateBackoff(
            runtimeCtx.policies.retry.type,
            attempt,
            runtimeCtx.policies.retry.base_delay_ms,
            runtimeCtx.policies.retry.max_delay_ms
          );
          
          globalMetrics.recordRetry(tenantId, serviceId, runtimeCtx.policies.retry.type);
          console.log(`Routing: Backing off for ${delay.toFixed(1)}ms before retry...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        } else {
          break; // Exit loop, cannot retry
        }
      }
    }

    if (!responseSent) {
      const duration = Date.now() - startTime;
      let statusCode = 502;
      let errorMsg = lastError ? lastError.message : 'Unknown gateway error';

      if (errorMsg.includes('Timeout')) {
        statusCode = 504;
        runtimeCtx.observability.timeoutEnforced = true;
        globalMetrics.recordTimeout(tenantId, serviceId);
      }

      globalMetrics.recordRequest(tenantId, sourceService, serviceId, statusCode.toString(), duration);

      clientRes.statusCode = statusCode;
      clientRes.setHeader('Content-Type', 'application/json');
      clientRes.end(JSON.stringify({ 
        error: `Gateway routing failure for service "${serviceId}"`,
        details: errorMsg,
        attempts: attempt
      }));
    }
  }

  /**
   * Forward the request using low-level node http API to support custom timeouts
   */
  executeHttpRequest(targetUrl, clientReq, runtimeCtx) {
    return new Promise((resolve, reject) => {
      const parsed = url.parse(targetUrl);
      const timeout = runtimeCtx.policies.timeout;
      
      let requestTimer = null;
      let connectTimer = null;
      let aborted = false;

      const reqOptions = {
        method: clientReq.method,
        host: parsed.hostname,
        port: parsed.port || 80,
        path: clientReq.url,
        headers: {
          ...clientReq.headers,
          ...runtimeCtx.toHeaders()
        }
      };

      // Set host header matching target
      reqOptions.headers['host'] = parsed.host;

      const proxyReq = http.request(reqOptions, (proxyRes) => {
        if (connectTimer) clearTimeout(connectTimer);
        
        const bodyChunks = [];
        proxyRes.on('data', chunk => bodyChunks.push(chunk));
        proxyRes.on('end', () => {
          if (requestTimer) clearTimeout(requestTimer);
          resolve({
            statusCode: proxyRes.statusCode,
            headers: proxyRes.headers,
            body: Buffer.concat(bodyChunks)
          });
        });
      });

      // Setup read timeout directly on the request to cover the header response phase
      proxyReq.setTimeout(timeout.read_ms, () => {
        if (!aborted) {
          aborted = true;
          proxyReq.destroy(new Error('ReadTimeout'));
        }
      });

      // Socket setup for connection timeout
      proxyReq.on('socket', (socket) => {
        if (socket.connecting) {
          connectTimer = setTimeout(() => {
            if (!aborted) {
              aborted = true;
              proxyReq.destroy(new Error('ConnectTimeout'));
            }
          }, timeout.connect_ms);
          
          socket.on('connect', () => {
            if (connectTimer) clearTimeout(connectTimer);
          });
        }
      });

      // Total request timeout
      requestTimer = setTimeout(() => {
        if (!aborted) {
          aborted = true;
          proxyReq.destroy(new Error('RequestTimeout'));
        }
      }, timeout.request_ms);

      proxyReq.on('error', (err) => {
        if (connectTimer) clearTimeout(connectTimer);
        if (requestTimer) clearTimeout(requestTimer);
        reject(err);
      });

      // Pipe request payload if method supports body
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(clientReq.method)) {
        clientReq.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    });
  }
}

module.exports = {
  RoutingEngine
};
