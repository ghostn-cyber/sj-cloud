const assert = require('assert');
const { translate } = require('../middleware/version-translator');

console.log('=== Running docker-api-proxy Unit Tests ===');

// Test 1: Translation of legacy path
{
  const testInput = Buffer.from('GET /v1.24/containers/json HTTP/1.1\r\nHost: docker\r\n\r\n', 'binary');
  const result = translate(testInput);
  
  assert.strictEqual(result.modified, true);
  assert.strictEqual(result.requestLine, 'GET /v1.24/containers/json HTTP/1.1');
  
  const resultStr = result.data.toString('binary');
  assert.ok(resultStr.includes('/v1.40/'));
  assert.ok(!resultStr.includes('/v1.24/'));
  console.log('✅ Test 1: Legacy path translation passed.');
}

// Test 2: Pass through of modern path
{
  const testInput = Buffer.from('GET /v1.40/info HTTP/1.1\r\nHost: docker\r\n\r\n', 'binary');
  const result = translate(testInput);
  
  assert.strictEqual(result.modified, false);
  const resultStr = result.data.toString('binary');
  assert.ok(resultStr.includes('/v1.40/'));
  console.log('✅ Test 2: Modern path pass-through passed.');
}

console.log('🎉 All unit tests passed successfully!');
