# ARCH-019: Service Mesh Runtime Governance & Platform Evolution

## Status
Approved

## Context
As the SJ Cloud runtime grows, the mesh platform requires strict governance, configuration immutability, automated policy enforcement, pluggable capabilities, and comprehensive telemetry. The legacy configuration paths were coupled to direct filesystem checks, lacks validation versioning, and lacks structured history log rollback mechanism. 

To solve this, we introduce the Platform Runtime Governance model.

## Decision
We establish a decoupled governance architecture consisting of the following pillars:

1. **Immutable Snapshots**:
   - The runtime planes consume only compiled, validated JSON snapshot files.
   - Every snapshot includes a semantic build number, SHA256 integrity checksum, compiled timestamp, and Git commit metadata.

2. **Decoupled Event-Driven Core**:
   - Centralized `EventBus` and `EventStore` decouples the Registry, Health Engine, and Compiler subsystems.
   - Major state shifts (circuit breaker trips, health transitions, config rollbacks) trigger typed events.

3. **Hierarchical Policy Resolution**:
   - Service configuration policies are resolved hierarchically: Default -> Service -> Tenant -> Environment.
   - Resolved configurations are cached in-memory with validation checks.

4. **Extensible Plugin and Capability Architecture**:
   - Pluggable capability discovery lets proxy engines determine service features (e.g. rate-limiting, scaling, databases) without code changes.
   - Plugin lifecycle manager exposes standard execution hooks (`onStartup`, `onReload`, `onShutdown`) for custom cross-cutting concerns.

5. **Diagnostic Admin API**:
   - Exposes `/admin/health`, `/admin/metrics`, `/admin/manifest`, `/admin/history`, `/admin/rollback`, and `/admin/policies/reload` endpoints for real-time observability and governance.

## Consequences
- **Security**: Integrity checks prevent unauthorized alterations to active service configurations.
- **Resilience**: Quick rollbacks via the `/admin/rollback` API allow instant mitigation of bad configuration rollouts.
- **Extensibility**: Pluggable backends allow transition from local JSON configs to distributed stores like etcd or Consul without changing the proxy logic.
