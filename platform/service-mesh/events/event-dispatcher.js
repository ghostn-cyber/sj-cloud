const { globalEventBus } = require('./event-bus');
const { globalEventStore } = require('./event-store');
const EventTypes = require('./event-types');

class EventDispatcher {
  constructor(bus = globalEventBus, store = globalEventStore) {
    this.bus = bus;
    this.store = store;
  }

  dispatch(type, payload = {}) {
    const event = this.bus.publish(type, payload);
    this.store.add(event);
    return event;
  }

  dispatchServiceRegistered(serviceId, config) {
    return this.dispatch(EventTypes.SERVICE_REGISTERED, { serviceId, config });
  }

  dispatchServiceUpdated(serviceId, config) {
    return this.dispatch(EventTypes.SERVICE_UPDATED, { serviceId, config });
  }

  dispatchServiceRemoved(serviceId) {
    return this.dispatch(EventTypes.SERVICE_REMOVED, { serviceId });
  }

  dispatchSnapshotCompiled(metadata) {
    return this.dispatch(EventTypes.SNAPSHOT_COMPILED, { metadata });
  }

  dispatchSnapshotActivated(metadata) {
    return this.dispatch(EventTypes.SNAPSHOT_ACTIVATED, { metadata });
  }

  dispatchSnapshotRolledBack(fromVersion, toVersion) {
    return this.dispatch(EventTypes.SNAPSHOT_ROLLED_BACK, { fromVersion, toVersion });
  }

  dispatchRegistryReloaded(serviceCount) {
    return this.dispatch(EventTypes.REGISTRY_RELOADED, { serviceCount });
  }

  dispatchHealthChanged(serviceId, fromStatus, toStatus) {
    return this.dispatch(EventTypes.HEALTH_CHANGED, { serviceId, fromStatus, toStatus });
  }

  dispatchCircuitOpened(serviceId) {
    return this.dispatch(EventTypes.CIRCUIT_OPENED, { serviceId });
  }

  dispatchCircuitClosed(serviceId) {
    return this.dispatch(EventTypes.CIRCUIT_CLOSED, { serviceId });
  }

  dispatchCircuitHalfOpen(serviceId) {
    return this.dispatch(EventTypes.CIRCUIT_HALF_OPEN, { serviceId });
  }

  dispatchRoutingPolicyChanged(serviceId, policy) {
    return this.dispatch(EventTypes.ROUTING_POLICY_CHANGED, { serviceId, policy });
  }
}

const globalEventDispatcher = new EventDispatcher();

module.exports = {
  EventDispatcher,
  globalEventDispatcher
};
