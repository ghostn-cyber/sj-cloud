const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 80;
const SERVICE_ID = process.env.SERVICE_ID || 'mock-service';

let isHealthy = true;
let isReady = true;
let inMaintenance = false;

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Mock-Service-Id', SERVICE_ID);

  // 1. Health Probe
  if (pathname === '/health') {
    if (!isHealthy) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ status: 'unhealthy', service: SERVICE_ID }));
    }
    if (inMaintenance) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ status: 'maintenance', service: SERVICE_ID }));
    }
    res.statusCode = 200;
    return res.end(JSON.stringify({ status: 'healthy', service: SERVICE_ID }));
  }

  // 2. Readiness Probe
  if (pathname === '/ready') {
    if (isReady && !inMaintenance) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ status: 'ready', service: SERVICE_ID }));
    } else {
      res.statusCode = 503;
      return res.end(JSON.stringify({ status: 'not_ready', service: SERVICE_ID }));
    }
  }

  // 3. Prometheus Metrics Probe
  if (pathname === '/metrics') {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    let metrics = '';
    metrics += `# HELP sj_mock_requests_total Total requests processed by mock service\n`;
    metrics += `# TYPE sj_mock_requests_total counter\n`;
    metrics += `sj_mock_requests_total{service="${SERVICE_ID}"} 42\n`;
    res.statusCode = 200;
    return res.end(metrics);
  }

  // 4. Testing Endpoints

  // Simulated Delay
  if (pathname === '/delay') {
    const ms = parseInt(searchParams.get('ms') || '1000', 10);
    console.log(`Mock [${SERVICE_ID}]: Simulating delay of ${ms}ms`);
    return setTimeout(() => {
      res.statusCode = 200;
      res.end(JSON.stringify({ delayed: true, ms, service: SERVICE_ID }));
    }, ms);
  }

  // Specific Status Code
  if (pathname === '/status') {
    const code = parseInt(searchParams.get('code') || '200', 10);
    console.log(`Mock [${SERVICE_ID}]: Returning status code ${code}`);
    res.statusCode = code;
    return res.end(JSON.stringify({ status: code, service: SERVICE_ID }));
  }

  // Echo Headers / Context
  if (pathname === '/echo') {
    res.statusCode = 200;
    return res.end(JSON.stringify({
      message: 'Echo response',
      service: SERVICE_ID,
      headers: req.headers,
      url: req.url,
      method: req.method
    }, null, 2));
  }

  // State Triggers (for testing state transitions)
  if (pathname === '/trigger/health') {
    const value = searchParams.get('enable') !== 'false';
    isHealthy = value;
    res.statusCode = 200;
    return res.end(JSON.stringify({ triggered: 'health', value, service: SERVICE_ID }));
  }

  if (pathname === '/trigger/ready') {
    const value = searchParams.get('enable') !== 'false';
    isReady = value;
    res.statusCode = 200;
    return res.end(JSON.stringify({ triggered: 'ready', value, service: SERVICE_ID }));
  }

  if (pathname === '/trigger/maintenance') {
    const value = searchParams.get('enable') === 'true';
    inMaintenance = value;
    res.statusCode = 200;
    return res.end(JSON.stringify({ triggered: 'maintenance', value, service: SERVICE_ID }));
  }

  // Default Route
  res.statusCode = 200;
  res.end(JSON.stringify({
    message: `Hello from mock service: ${SERVICE_ID}`,
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, () => {
  console.log(`Mock Service "${SERVICE_ID}" listening on port ${PORT}`);
});
