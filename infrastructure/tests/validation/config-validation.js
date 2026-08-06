const assert = require('assert');
const fs = require('fs');
const path = require('path');
const configManager = require('../../../platform/shared/config/config-manager');
const configLoader = require('../../../platform/shared/config/config-loader');
const configValidator = require('../../../platform/shared/config/config-validator');
const { PlatformConfig, NetworkConfig, SecurityConfig } = require('../../../platform/shared/config/config-context');
const { globalConfigCache } = require('../../../platform/shared/config/config-cache');
const globalConfigEvents = require('../../../platform/shared/config/config-events');
const { globalConfigHistory } = require('../../../platform/shared/config/config-history');

function runTests() {
  console.log('🧪 Running Platform Configuration validation tests...');

  // 1. Check Loader functionality & Defaults loading
  try {
    const loaded = configLoader.load();
    assert.ok(loaded, 'Config should be loaded successfully');
    assert.strictEqual(loaded.PLATFORM_NAME, 'SJ Cloud', 'Default platform name should be "SJ Cloud"');
    assert.strictEqual(loaded.HTTP_PORT, 80, 'Default HTTP port should be 80');
    console.log('✅ Default configuration loading tests passed.');
  } catch (err) {
    console.error('❌ Default loading test failed:', err);
    process.exit(1);
  }

  // 2. Check override priority (runtime overrides override defaults)
  try {
    const overrideVal = 'SJ Custom Test Ingress';
    const overrides = { PLATFORM_NAME: overrideVal };
    const loaded = configLoader.load(overrides);
    assert.strictEqual(loaded.PLATFORM_NAME, overrideVal, 'Runtime override should take precedence');
    console.log('✅ Configuration override priority tests passed.');
  } catch (err) {
    console.error('❌ Override test failed:', err);
    process.exit(1);
  }

  // 3. Validation Schema Enforcement
  try {
    // Missing required field (e.g. PLATFORM_NAME removed)
    const base = configLoader.load();
    const invalid = { ...base };
    delete invalid.PLATFORM_NAME;

    assert.throws(() => {
      configValidator.validate(invalid);
    }, /Missing required configuration/, 'Should throw validation error on missing required keys');

    // Mismatched type (e.g. HTTP_PORT is a string instead of number)
    const invalidType = { ...base, HTTP_PORT: 'invalid-port' };
    assert.throws(() => {
      configValidator.validate(invalidType);
    }, /Validation Failed/, 'Should throw validation error on invalid port type');

    console.log('✅ Validation schema enforcement tests passed.');
  } catch (err) {
    console.error('❌ Validation schema test failed:', err);
    process.exit(1);
  }

  // 4. Secret Redaction
  try {
    const redacted = configManager.getRedacted();
    assert.strictEqual(redacted.JWT_SECRET, '[REDACTED]', 'JWT_SECRET must be redacted');
    assert.strictEqual(redacted.POSTGRES_PASSWORD, '[REDACTED]', 'POSTGRES_PASSWORD must be redacted');
    assert.strictEqual(redacted.PLATFORM_NAME, 'SJ Cloud', 'Non-secret fields should remain cleartext');
    console.log('✅ Secret redaction verification tests passed.');
  } catch (err) {
    console.error('❌ Secret redaction test failed:', err);
    process.exit(1);
  }

  // 5. Immutability of resolved config context objects
  try {
    assert.throws(() => {
      PlatformConfig.PLATFORM_NAME = 'Mutated';
    }, TypeError, 'Context object properties should be immutable (read-only/deep frozen)');

    assert.throws(() => {
      NetworkConfig.HTTP_PORT = 999;
    }, TypeError, 'NetworkConfig properties should be immutable');

    console.log('✅ Immutability of configuration contexts passed.');
  } catch (err) {
    console.error('❌ Immutability test failed:', err);
    process.exit(1);
  }

  // 6. Live reloading, history tracking, and events
  try {
    let eventReceived = false;
    let reloadPayload = null;

    globalConfigEvents.once('reload', (config) => {
      eventReceived = true;
      reloadPayload = config;
    });

    const previousVer = globalConfigHistory.getCurrentVersion();
    configManager.reload({ PLATFORM_NAME: 'Reloaded Platform' });

    assert.ok(eventReceived, 'Reload event must be fired');
    assert.strictEqual(reloadPayload.PLATFORM_NAME, 'Reloaded Platform', 'Payload must contain the new overrides');
    assert.strictEqual(PlatformConfig.PLATFORM_NAME, 'Reloaded Platform', 'PlatformConfig context should reflect reload updates');
    assert.strictEqual(globalConfigHistory.getCurrentVersion(), previousVer + 1, 'Configuration version should increment');

    // Verify history logs
    const historyLogs = globalConfigHistory.getHistory();
    assert.ok(historyLogs.length > 0, 'History logs should record config changes');
    const latestChange = historyLogs[historyLogs.length - 1];
    assert.strictEqual(latestChange.version, globalConfigHistory.getCurrentVersion());

    console.log('✅ Live reload, eventing, and version tracking tests passed.');
  } catch (err) {
    console.error('❌ Live reload and tracking tests failed:', err);
    process.exit(1);
  }

  // 7. Config Management Metrics
  try {
    const metrics = configManager.getMetrics();
    assert.ok(metrics.sj_platform_config_reload_total >= 1, 'Reload metrics count should increment');
    assert.strictEqual(metrics.sj_platform_environment, 'development', 'Environment metric should default to development');
    console.log('✅ Config manager metrics validation passed.');
  } catch (err) {
    console.error('❌ Config metrics test failed:', err);
    process.exit(1);
  }

  console.log('🎉 All Platform Configuration tests passed successfully!');
}

runTests();
