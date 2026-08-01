const http = require('http');
const path = require('path');
const assert = require('assert');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const SNAPSHOT_PATH = path.join(PROJECT_ROOT, 'config/services/snapshot.json');

// Force test ports to avoid collisions
process.env.PORT = '8090';
process.env.ADMIN_PORT = '9091';

console.log('=== Service Mesh Governance Integration Tests ===');

// Require the proxy server to start it
require('../../../platform/service-mesh/proxy/server');

// Helper to make HTTP requests
function get(pathOpt) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:9091${pathOpt}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}

function post(pathOpt, payload) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: 'localhost',
      port: 9091,
      path: pathOpt,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  try {
    // Wait for server to be fully listening
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: GET /admin/health
    console.log('Testing: GET /admin/health');
    const health = await get('/admin/health');
    assert.strictEqual(health.statusCode, 200, 'Health endpoint should return 200');
    const healthBody = JSON.parse(health.body);
    assert.strictEqual(healthBody.status, 'UP');
    assert.ok(healthBody.state === 'READY' || healthBody.state === 'Ready', `State should be READY, got "${healthBody.state}"`);
    console.log('✅ Health test passed.');

    // Test 2: GET /admin/metrics
    console.log('Testing: GET /admin/metrics');
    const metrics = await get('/admin/metrics');
    assert.strictEqual(metrics.statusCode, 200, 'Metrics endpoint should return 200');
    assert.ok(metrics.body.includes('sj_mesh_cache_hits_total'), 'Metrics should include cache hit count');
    assert.ok(metrics.body.includes('sj_mesh_snapshot_version'), 'Metrics should include snapshot version');
    console.log('✅ Metrics test passed.');

    // Test 3: GET /admin/manifest
    console.log('Testing: GET /admin/manifest');
    const manifest = await get('/admin/manifest');
    assert.strictEqual(manifest.statusCode, 200, 'Manifest endpoint should return 200');
    const manifestBody = JSON.parse(manifest.body);
    assert.ok(manifestBody.services, 'Manifest should contain services object');
    assert.ok(manifestBody.sha256, 'Manifest should contain sha256 checksum');
    console.log('✅ Manifest test passed.');

    // Test 3b: GET /manifest (Runtime Manifest)
    console.log('Testing: GET /manifest');
    const runtimeManifest = await get('/manifest');
    assert.strictEqual(runtimeManifest.statusCode, 200, '/manifest should return 200');
    const runtimeManifestBody = JSON.parse(runtimeManifest.body);
    assert.strictEqual(runtimeManifestBody.platformName, 'SJ Cloud');
    assert.strictEqual(runtimeManifestBody.runtimeState, 'READY');
    console.log('✅ Runtime manifest test passed.');

    // Test 3c: GET /runtime/state (FSM Status)
    console.log('Testing: GET /runtime/state');
    const runtimeStateRes = await get('/runtime/state');
    assert.strictEqual(runtimeStateRes.statusCode, 200, '/runtime/state should return 200');
    const runtimeStateBody = JSON.parse(runtimeStateRes.body);
    assert.strictEqual(runtimeStateBody.state, 'READY');
    console.log('✅ Runtime state endpoint test passed.');

    // Test 3d: GET /logs & GET /traces
    console.log('Testing: GET /logs and GET /traces');
    const logsRes = await get('/logs');
    assert.strictEqual(logsRes.statusCode, 200);
    const tracesRes = await get('/traces');
    assert.strictEqual(tracesRes.statusCode, 200);
    console.log('✅ Logs and traces endpoints test passed.');

    // Test 4: POST /admin/policies/reload
    console.log('Testing: POST /admin/policies/reload');
    const reload = await post('/admin/policies/reload', '{}');
    assert.strictEqual(reload.statusCode, 200, 'Policy reload endpoint should return 200');
    const reloadBody = JSON.parse(reload.body);
    assert.strictEqual(reloadBody.success, true);
    console.log('✅ Policy reload test passed.');

    // Test 5: GET /admin/history
    console.log('Testing: GET /admin/history');
    const history = await get('/admin/history');
    console.log('History response body:', history.body);
    assert.strictEqual(history.statusCode, 200, 'History endpoint should return 200');
    const historyBody = JSON.parse(history.body);
    assert.ok(Array.isArray(historyBody), 'History should be an array');
    console.log('✅ History test passed.');

    // Test 6: POST /admin/rollback
    console.log('Testing: POST /admin/rollback');
    const targetBuild = historyBody.length > 0 ? historyBody[0].buildNumber : 1;
    const rollback = await post('/admin/rollback', JSON.stringify({ buildNumber: targetBuild }));
    console.log('Rollback response body:', rollback.body);
    assert.strictEqual(rollback.statusCode, 200, 'Rollback endpoint should return 200');
    const rollbackBody = JSON.parse(rollback.body);
    assert.strictEqual(rollbackBody.success, true);
    assert.strictEqual(rollbackBody.buildNumber, targetBuild);
    console.log('✅ Rollback test passed.');

    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration Test Failed:', err);
    process.exit(1);
  }
}

runTests();
