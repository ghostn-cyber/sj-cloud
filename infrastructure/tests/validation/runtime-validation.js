const assert = require('assert');
const { RuntimeError, PolicyError, ValidationError } = require('../../../platform/shared/errors');
const { StateMachine } = require('../../../platform/service-mesh/runtime/state/state-machine');
const { States } = require('../../../platform/service-mesh/runtime/state/runtime-state');
const { ServiceIdentity } = require('../../../platform/service-mesh/identity');
const { PolicyResolver } = require('../../../platform/service-mesh/policy');
const { PluginManager } = require('../../../platform/service-mesh/plugins');

console.log('=== Running Modular Governance Validation Tests ===');

// 1. Test Typed Errors
try {
  throw new RuntimeError('Runtime failure occurred', { details: { reason: 'disk full' } });
} catch (err) {
  assert.ok(err instanceof RuntimeError);
  assert.strictEqual(err.error_code, 'RUNTIME_ERROR');
  assert.strictEqual(err.category, 'RUNTIME');
  assert.strictEqual(err.details.reason, 'disk full');
  console.log('✅ Typed error validation passed.');
}

// 2. Test FSM State Transitions
const fsm = new StateMachine(States.BOOTING);
assert.strictEqual(fsm.getState(), States.BOOTING);

fsm.transitionTo(States.LOADING);
assert.strictEqual(fsm.getState(), States.LOADING);

fsm.transitionTo(States.READY);
assert.strictEqual(fsm.getState(), States.READY);

// Try an invalid transition: READY -> BOOTING
try {
  fsm.transitionTo(States.BOOTING);
  assert.fail('Should have rejected invalid transition');
} catch (err) {
  assert.ok(err.message.includes('Invalid state transition'));
  console.log('✅ FSM state transition validation passed.');
}

// 3. Test Service Identity & SPIFFE mappings
const identity = new ServiceIdentity({
  serviceId: 'payment-service',
  namespace: 'finance',
  trustLevel: 'high'
});
assert.strictEqual(identity.getSPIFFEID(), 'spiffe://sjcloud.io/ns/finance/sa/payment-service');
console.log('✅ Service Identity validation passed.');

// 4. Test Policy Resolution
const baseSpec = {
  timeouts: { connect_ms: 1000 },
  retry: { max_attempts: 5 }
};
const resolved = PolicyResolver.resolve(baseSpec, { timeouts: { read_ms: 3000 } }, 'development');
assert.strictEqual(resolved.timeouts.connect_ms, 1000);
assert.strictEqual(resolved.timeouts.read_ms, 3000);
assert.strictEqual(resolved.retry.max_attempts, 5);
console.log('✅ Policy Resolution validation passed.');

// 5. Test Plugin Framework
const pm = new PluginManager();
let hookCalled = false;
const mockPlugin = {
  initialize: (cfg) => { assert.strictEqual(cfg.foo, 'bar'); },
  onRequest: () => { hookCalled = true; }
};
pm.loadPlugin('mock', mockPlugin);
pm.initializePlugin('mock', { foo: 'bar' }).then(() => {
  return pm.executeHook('onRequest');
}).then(() => {
  assert.ok(hookCalled);
  console.log('✅ Plugin framework validation passed.');
  console.log('🎉 ALL MODULAR GOVERNANCE VALIDATION TESTS PASSED!');
}).catch(err => {
  console.error('❌ Validation test failed:', err);
  process.exit(1);
});
