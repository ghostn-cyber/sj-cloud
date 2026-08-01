# Service Discovery

**Document ID:** ARCH-SD-001

**Status:** Approved

**Version:** 1.0

**Last Updated:** Milestone 5 — Platform Service Discovery

---

# 1. Purpose

This document defines the Service Discovery architecture for SJ Cloud.

Service Discovery enables platform components to locate, communicate with, monitor, and replace services dynamically without relying on hardcoded IP addresses or infrastructure-specific configuration.

It is a foundational component of the platform's microservice architecture.

---

# 2. Scope

This specification defines:

- Service registration
- Service discovery
- Service identity
- Health-aware routing
- DNS-based discovery
- Future Kubernetes integration
- Configuration model

This document does not define API routing or gateway middleware.

---

# 3. Design Principles

The Service Discovery layer shall be:

- Stateless
- Configuration-driven
- Platform-managed
- Health-aware
- Infrastructure-independent
- Tenant-aware
- Horizontally scalable

No service may depend on container IP addresses.

---

# 4. Architecture

```
                API Gateway
                     │
             Routing Engine
                     │
             Service Discovery
                     │
      ┌──────────────┼──────────────┐
      │              │              │
    Auth         Storage      Notification
      │              │              │
      └──────────────┼──────────────┘
                     │
              Docker DNS
                     │
               Runtime Network
```

---

# 5. Responsibilities

The Service Discovery layer is responsible for:

- Registering services
- Resolving service names
- Tracking health
- Selecting healthy instances
- Supporting scaling
- Abstracting infrastructure

It is not responsible for authentication, authorization, or business logic.

---

# 6. Service Identity

Every service has a globally unique identity.

Minimum metadata:

```yaml
service:
  id:
  name:
  version:
  environment:
  visibility:
  owner:
```

Example:

```yaml
service:
  id: auth
  name: Authentication Service
  version: 1.0.0
```

---

# 7. Service Registry

The registry is the authoritative source of service metadata.

Each registered service contains:

```yaml
service:
  endpoint:
  protocol:
  health:
  metrics:
  network:
  dependencies:
```

Example:

```yaml
service:

  endpoint: http://auth:8080

  protocol: http

  health: /health

  metrics: /metrics
```

---

# 8. Discovery Flow

```
Request

↓

Routing Engine

↓

Service Registry

↓

Resolve Service

↓

Health Check

↓

Forward Request
```

---

# 9. Docker Implementation

Local development uses Docker DNS.

Example:

```
auth

storage

notifications

analytics

search

queue
```

Containers communicate using service names only.

Example:

```
http://auth:8080
```

Never:

```
172.20.x.x
```

---

# 10. Kubernetes Implementation

Future production deployments replace Docker DNS with Kubernetes Services.

Example:

```
auth.default.svc.cluster.local

storage.default.svc.cluster.local
```

Applications must not require code changes.

---

# 11. Health Management

Each service exposes:

```
/health

/ready

/metrics
```

Only healthy services receive traffic.

---

# 12. Load Balancing

Discovery supports multiple service instances.

Strategies:

- Round Robin
- Least Connections
- Weighted
- Health Based

Selection occurs after unhealthy instances are excluded.

---

# 13. Failure Handling

If no healthy instance exists:

```
503 Service Unavailable
```

The gateway must never route traffic to unhealthy services.

---

# 14. Security

Service discovery is accessible only on internal networks.

External clients cannot query the registry.

Service metadata must never expose secrets.

---

# 15. Observability

Every lookup records:

- Lookup latency
- Resolution success
- Failed lookups
- Health failures
- Registry errors

Metrics are exported to Prometheus.

---

# 16. Configuration

Services are registered using YAML.

Example:

```yaml
service:
  id: auth

  endpoint: http://auth:8080

  network: sj-services

  health: /health

  metrics: /metrics
```

---

# 17. Future Evolution

The Service Discovery architecture is designed to support:

- Kubernetes Services
- Consul
- etcd
- Service Mesh
- Multi-region discovery
- Geographic routing
- Canary deployments
- Blue/Green deployments
- Automatic failover

No application changes should be required when the discovery backend changes.

---

# 18. Related Documents

- API-GATEWAY.md
- ROUTING-ENGINE.md
- REQUEST-LIFECYCLE.md
- SERVICE-COMMUNICATION.md
- NETWORK-TOPOLOGY.md
- TENANT-RESOLUTION.md
- ARCHITECTURE-DECISIONS.md