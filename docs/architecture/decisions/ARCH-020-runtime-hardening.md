# ARCH-020: Service Mesh Runtime Hardening & Platform Governance

## Status
Approved

## Context
Following the implementation of the core service mesh foundation and basic governance, the SJ Cloud platform requires rigorous operational stability. We must transition from generic JavaScript objects and error strings to standard runtime structures including typed errors, structured lifecycles, cryptographically provable identities, pluggable request interceptors, and platform manifests.

## Decision
We introduce the following architectural components to harden the runtime execution plane:

1. **Typed Error Hierarchy**:
   - All modules throw typed, structured subclasses of a shared `PlatformError` (`RuntimeError`, `CompilerError`, `PolicyError`, `ValidationError`, `RoutingError`, `IdentityError`, etc.).
   - Errors embed severity, error code, component context, and whether they are recoverable.

2. **9-State Runtime Finite State Machine (FSM)**:
   - Tracks the service mesh runtime lifecycle: `BOOTING` -> `LOADING` -> `READY` -> `RELOADING` -> `DEGRADED` -> `RECOVERING` -> `FAILED` -> `STOPPING` -> `STOPPED`.
   - Transitions are strictly validated. Invalid transitions reject instantly and raise errors.
   - Emits Prometheus telemetry metrics (`runtime_state`, `runtime_transitions_total`, `runtime_uptime_seconds`) and broadcasts EventBus lifecycle notifications.

3. **Service Identity & SPIFFE Mappings**:
   - Every service is assigned an immutable cryptographic SPIFFE ID format: `spiffe://sjcloud.io/ns/<namespace>/sa/<service-id>`.
   - Schema validation requires `service_id`, `namespace`, `trust_level`, and supports capabilities, labels, and resource classes.

4. **Extensible Plugin Hook Framework**:
   - Features standard interceptor Hooks: `onStartup`, `onShutdown`, `onRequest`, `onResponse`, `onEvent`.
   - Plugin lifecycle states are governed (`UNLOADED`, `LOADED`, `INITIALIZED`, `ACTIVE`, `FAILED`) and tracked.

5. **Diagnostic Runtime Manifest**:
   - Exposes `/manifest` yielding a complete system state snapshot (commit, build, service count, state, feature flags, API versions) generated automatically during compilation.

## Consequences
- **Robustness**: Prevent unhandled transitions or silent failures; compile errors abort configuration loading.
- **Traceability**: Unified Prometheus gauges and OpenTelemetry context propagation enable end-to-end tracing.
