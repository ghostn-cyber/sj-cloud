# ARCH-018: Service Registry and Mesh Proxy Architecture

## Status
Approved

## Context
As the SJ Cloud platform grows, service-to-service communication requires service discovery, client-side load balancing, timeouts, retries, and circuit breakers. The initial design proposed an active Registry API in the critical request path. However, invoking a remote registry API for every request would introduce severe latency overhead, single-point-of-failure risks, and scalability bottlenecks.

## Decision
We decouple the control plane responsibilities from the runtime routing path by establishing the following boundaries:

1. **Control Plane / Runtime Separation:**
   - **Control Plane (Service Registry):** Responsible for configuration loading, schema validation, snapshot compilation, developer APIs, CLI tooling, and dashboard status collection.
   - **Runtime Plane (Mesh Proxy):** Responsible for routing, load balancing, timeouts, retries, circuit breaking, and telemetry collection.

2. **Snapshot Compilation:**
   - Instead of parsing YAML configuration files dynamically at runtime, configurations are validated and compiled into a single consolidated JSON snapshot file (`config/services/snapshot.json`).
   - The compilation occurs offline (during CI/CD or startup) and dynamically under development watch rules.

3. **Runtime Cache:**
   - The Mesh Proxy loads the compiled JSON snapshot directly into a local in-memory `RuntimeCache`.
   - The cache watches `snapshot.json` for hot-reloads, eliminating all network hops to the Registry API during request intercepts.

4. **Registry Backend Abstraction:**
   - Introduce a `RegistryBackend` interface to abstract configuration sources, defaulting to the local `FilesystemBackend`. This preserves logic when migrating to Consul, etcd, or Kubernetes CRDs in the future.

## Consequences
- **Low Latency:** Live request routing matches destination rules in memory, adding < 1ms overhead.
- **Robust Isolation:** The runtime mesh proxy continues routing traffic using cached rules even if the control plane / registry API crashes.
- **Developer Experience:** Hot-reloads occur automatically on config modification.
- **Kubernetes Readiness:** The compiled snapshot concept maps directly to Kubernetes CoreDNS and Istio Envoy CRD compilation.
