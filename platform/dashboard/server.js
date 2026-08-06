const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 80;

// Resolve paths relative to runtime root
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const TENANTS_DIR = process.env.TENANTS_DIR || path.join(PROJECT_ROOT, 'tenants');

// Import Platform Components
const { globalDashboardApi } = require('./dashboard-api');
const { globalTenantRegistry } = require('../tenant-manager/registry/tenant-registry');
const { globalApplicationRegistry } = require('../application-manager/registry/application-registry');
const { AuditQuery } = require('../tenant-manager/audit/audit-query');

const auditQuery = new AuditQuery(TENANTS_DIR);

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health Probe
  if (pathname === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ status: 'healthy', service: 'dashboard' }));
  }

  // 2. Readiness Probe
  if (pathname === '/ready') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ status: 'ready', service: 'dashboard' }));
  }

  // 3. API Endpoints
  if (pathname === '/api/dashboard') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(globalDashboardApi.getDashboardData()));
  }

  if (pathname === '/api/tenants') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(globalTenantRegistry.getAllTenants()));
  }

  if (pathname === '/api/deployments') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(globalApplicationRegistry.getAllApplications()));
  }

  if (pathname === '/api/audit') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(auditQuery.queryAll()));
  }

  // 4. Serve index.html for root path
  if (pathname === '/' || pathname === '/index.html') {
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    if (!fs.existsSync(htmlPath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Dashboard UI index.html not found.');
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(fs.readFileSync(htmlPath, 'utf8'));
  }

  // Default fallback 404
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Platform Control Plane Dashboard running on port ${PORT}`);
});
