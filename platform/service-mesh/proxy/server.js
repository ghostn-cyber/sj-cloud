const http = require('http');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const { RuntimeCache } = require('../cache/cache');
const { RoutingEngine } = require('../routing/engine');
const { globalMetrics } = require('../observability/metrics');
const { globalLifecycleManager } = require('../runtime');
const { HealthMonitor } = require('../health/monitor');
const SnapshotManager = require('../cache/snapshot-manager');
const { FilesystemBackend } = require('../registry/backend');
const { RegistryLoader } = require('../registry/loader');
const { SnapshotCompiler } = require('../compiler/compiler');

const PORT = process.env.PORT || 80;
const ADMIN_PORT = process.env.ADMIN_PORT || 9090;

const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const SNAPSHOT_PATH = path.join(PROJECT_ROOT, 'config/services/snapshot.json');

console.log('=== Initializing Service Mesh Proxy ===');
console.log(`Snapshot location: ${SNAPSHOT_PATH}`);

const runtimeCache = new RuntimeCache(SNAPSHOT_PATH);
runtimeCache.startWatching();

const routingEngine = new RoutingEngine(runtimeCache);

// Initialize Lifecycle Manager
globalLifecycleManager.startup(async () => {
  runtimeCache.load();
}).catch(err => {
  console.error('Lifecycle startup failure:', err);
});

const snapshotManager = new SnapshotManager(SNAPSHOT_PATH, path.join(PROJECT_ROOT, 'history'));

const healthMonitor = new HealthMonitor(runtimeCache.getAllServices());
runtimeCache.onReload((services) => {
  healthMonitor.updateConfigs(services);
});
healthMonitor.start();

const backend = new FilesystemBackend(path.join(PROJECT_ROOT, 'config/services'));
const regLoader = new RegistryLoader(backend);
const snapshotCompiler = new SnapshotCompiler(regLoader, SNAPSHOT_PATH);

// 1. Primary Proxy Server (Routes internal HTTP requests)
const proxyServer = http.createServer((req, res) => {
  routingEngine.routeRequest(req, res)
    .catch(err => {
      console.error('Proxy routing unhandled error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal proxy routing error', details: err.message }));
      }
    });
});

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      resolve(body);
    });
  });
}

// 2. Admin Server (Exposes internal health and Prometheus metrics)
const adminServer = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  res.setHeader('Content-Type', 'application/json');

  if ((pathname === '/health' || pathname === '/ready' || pathname === '/admin/health') && req.method === 'GET') {
    res.statusCode = 200;
    const currentState = globalLifecycleManager.fsm.getState().toUpperCase();
    return res.end(JSON.stringify({
      status: currentState === 'READY' ? 'UP' : 'DOWN',
      state: currentState,
      services: healthMonitor.getAllStatuses()
    }, null, 2));
  }

  if ((pathname === '/metrics' || pathname === '/admin/metrics') && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.statusCode = 200;
    return res.end(globalMetrics.toPrometheusString());
  }

  if ((pathname === '/runtime/state' || pathname === '/admin/runtime/state') && req.method === 'GET') {
    res.statusCode = 200;
    return res.end(JSON.stringify(globalLifecycleManager.fsm.getStatus(), null, 2));
  }

  if (pathname === '/admin/manifest' && req.method === 'GET') {
    if (fs.existsSync(SNAPSHOT_PATH)) {
      res.statusCode = 200;
      return res.end(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    } else {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: 'Manifest snapshot not found' }));
    }
  }

  if (pathname === '/manifest' && req.method === 'GET') {
    const manifestPath = path.join(PROJECT_ROOT, 'config/services/manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.runtimeState = globalLifecycleManager.fsm.getState().toUpperCase();
        try {
          const { globalPluginManager } = require('../plugins');
          manifest.pluginCount = globalPluginManager.registry.getPlugins().length;
        } catch (_) {}
        res.statusCode = 200;
        return res.end(JSON.stringify(manifest, null, 2));
      } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: 'Failed to read manifest', details: err.message }));
      }
    } else {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: 'Manifest not found' }));
    }
  }

  if ((pathname === '/logs' || pathname === '/admin/logs') && req.method === 'GET') {
    res.statusCode = 200;
    return res.end(JSON.stringify({ logs: [] }, null, 2));
  }

  if ((pathname === '/traces' || pathname === '/admin/traces') && req.method === 'GET') {
    res.statusCode = 200;
    return res.end(JSON.stringify({ traces: [] }, null, 2));
  }

  if (pathname === '/admin/history' && req.method === 'GET') {
    const history = snapshotManager.getHistory();
    res.statusCode = 200;
    return res.end(JSON.stringify(history, null, 2));
  }

  if (pathname === '/admin/rollback' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      let buildNumber;
      try {
        const parsed = JSON.parse(body);
        buildNumber = parsed.buildNumber;
      } catch (_) {
        buildNumber = parseInt(urlObj.searchParams.get('buildNumber'), 10);
      }

      if (!buildNumber || isNaN(buildNumber)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Missing or invalid buildNumber' }));
      }

      const rolledBack = snapshotManager.rollback(buildNumber);
      res.statusCode = 200;
      return res.end(JSON.stringify({ success: true, buildNumber, snapshot: rolledBack }));
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Rollback failed', details: err.message }));
    }
  }

  if (pathname === '/admin/policies/reload' && req.method === 'POST') {
    try {
      const compileResult = await snapshotCompiler.compile();
      if (compileResult.success) {
        runtimeCache.load();
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, message: 'Policies reloaded and compiled successfully' }));
      } else {
        res.statusCode = 500;
        return res.end(JSON.stringify({ success: false, errors: compileResult.errors }));
      }
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Policy reload failed', details: err.message }));
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Listeners
proxyServer.listen(PORT, () => {
  console.log(`Service Mesh Proxy listening on port ${PORT}`);
});

adminServer.listen(ADMIN_PORT, () => {
  console.log(`Service Mesh Admin API listening on port ${ADMIN_PORT}`);
});

// Graceful termination
function shutdown() {
  console.log('Shutting down Service Mesh Proxy...');
  runtimeCache.stopWatching();
  healthMonitor.stop();
  globalLifecycleManager.shutdown();
  
  let closed = 0;
  const done = () => {
    closed++;
    if (closed === 2) {
      console.log('Service Mesh Proxy stopped.');
      process.exit(0);
    }
  };

  proxyServer.close(done);
  adminServer.close(done);

  setTimeout(() => {
    console.warn('Forcing exit...');
    process.exit(1);
  }, 3000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
