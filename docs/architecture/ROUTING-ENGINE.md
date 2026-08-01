# Routing Engine

**Document ID:** ARCH-ROUTE-001

**Status:** Approved

**Version:** 1.0

**Last Updated:** Milestone 5 — API Gateway Foundation

---

# 1. Purpose

The Routing Engine is responsible for determining the correct destination for every request entering SJ Cloud.

It translates an incoming request into a platform service destination without exposing internal infrastructure to clients.

The Routing Engine performs no authentication, authorization, validation, or business logic. Those responsibilities belong to dedicated middleware components.

---

# 2. Scope

This document defines:

- Route resolution
- Service discovery
- Endpoint matching
- Tenant-aware routing
- Internal service forwarding
- Route configuration
- Failure handling
- Performance objectives

This document does not define middleware execution or request lifecycle.

---

# 3. Architectural Position

```
Internet
    │
Cloudflare
    │
Traefik
    │
API Gateway
    │
┌─────────────────────────────┐
│      Routing Engine         │
└─────────────────────────────┘
    │
    ▼
Service Discovery
    │
    ▼
Destination Service
```

The Routing Engine executes after request validation and before service invocation.

---

# 4. Responsibilities

The Routing Engine is responsible for:

- Matching incoming routes
- Resolving API versions
- Selecting destination services
- Discovering service endpoints
- Applying route policies
- Forwarding requests
- Handling unavailable services

The Routing Engine is **not** responsible for:

- Authentication
- Authorization
- Request validation
- Rate limiting
- Logging
- Metrics collection

---

# 5. Design Principles

The Routing Engine shall be:

- Stateless
- Deterministic
- Configuration-driven
- Tenant-aware
- Horizontally scalable
- Extensible
- Protocol agnostic

No routing decisions shall depend on local container state.

---

# 6. Route Resolution Pipeline

Every request follows the same routing sequence.

```
Incoming Request
        │
        ▼
Normalize Path
        │
        ▼
Resolve Tenant
        │
        ▼
Resolve API Version
        │
        ▼
Match Route
        │
        ▼
Resolve Service
        │
        ▼
Resolve Instance
        │
        ▼
Forward Request
```

---

# 7. Route Matching

Routes are matched using the following priority:

1. Exact path
2. Static route
3. Parameterized route
4. Wildcard route
5. Default handler

Example:

```
/api/v1/auth/login

/api/v1/storage/files

/api/v1/users/{id}

/api/v1/*
```

Exact matches always take precedence.

---

# 8. Route Configuration

Routes are configuration-driven.

Example:

```yaml
route:
  path: /api/v1/auth
  service: auth
  methods:
    - GET
    - POST
```

Routes shall never be hardcoded into application logic.

---

# 9. Service Discovery

After resolving a route, the Routing Engine requests the destination from the Service Registry.

Example:

```
auth

↓

http://auth:8080
```

The registry is the single source of truth for service locations.

---

# 10. Service Registry

Initially, the Service Registry is configuration-based.

Future implementations may use:

- Kubernetes Services
- Consul
- etcd
- Platform Registry API

The Routing Engine must remain independent of the registry implementation.

---

# 11. Destination Resolution

Each route resolves to exactly one logical service.

Example:

| Route | Service |
|---------|---------|
| /api/v1/auth | auth |
| /api/v1/storage | storage |
| /api/v1/search | search |
| /api/v1/notifications | notifications |
| /api/v1/analytics | analytics |

---

# 12. Multi-Tenant Routing

Routing occurs only after tenant resolution.

Example:

```
tenant-a.startupjigawa.test

↓

Tenant A Runtime

--------------------

tenant-b.startupjigawa.test

↓

Tenant B Runtime
```

Tenant resolution is documented separately in **TENANT-RESOLUTION.md**.

---

# 13. Internal Service Routing

Internal platform services are addressed using Docker DNS.

Examples:

```
http://auth

http://storage

http://analytics

http://notifications
```

No service shall reference container IP addresses.

---

# 14. Route Policies

Routes may define policies.

Examples:

```yaml
authentication: required

authorization: admin

timeout: 10s

retry: 3

cache: disabled
```

The Routing Engine forwards these policies to the middleware pipeline.

---

# 15. Load Balancing

If multiple instances of a service exist, the Routing Engine delegates load balancing to the service discovery layer.

Supported strategies:

- Round Robin
- Least Connections
- Weighted
- Health-Based

The Routing Engine does not implement balancing logic directly.

---

# 16. Retry Strategy

Retry is permitted only for idempotent requests.

Eligible methods:

- GET
- HEAD
- OPTIONS

Default policy:

- Maximum retries: 3
- Exponential backoff
- Random jitter

POST, PATCH, PUT, and DELETE requests are not automatically retried unless explicitly configured.

---

# 17. Timeouts

Default routing timeout:

```
30 seconds
```

Service-specific overrides may be configured.

Requests exceeding timeout limits return:

```
504 Gateway Timeout
```

---

# 18. Failure Handling

Possible failures include:

- Route not found
- Service unavailable
- Registry unavailable
- Timeout
- Invalid configuration

Standard responses:

| Failure | Response |
|----------|----------|
| Unknown Route | 404 |
| Service Down | 503 |
| Timeout | 504 |
| Invalid Configuration | 500 |

---

# 19. Health Awareness

The Routing Engine forwards requests only to healthy services.

Health status is determined through:

```
/health

/ready
```

Unhealthy instances are excluded from routing decisions.

---

# 20. Caching

Route definitions may be cached.

Service registry entries may also be cached.

The cache must automatically invalidate on configuration reload.

Business responses are never cached by the Routing Engine.

---

# 21. Performance Objectives

| Metric | Target |
|----------|---------|
| Route Lookup | <1 ms |
| Registry Lookup | <2 ms |
| Forwarding Decision | <1 ms |
| Total Routing Time | <5 ms |

---

# 22. Security

The Routing Engine shall never:

- Execute business logic
- Bypass authentication
- Modify request payloads
- Expose internal addresses
- Expose container names

Only logical service names are visible within configuration.

---

# 23. Configuration Sources

Routing configuration may originate from:

- YAML
- JSON
- Platform Registry
- Database (future)
- Kubernetes CRDs (future)

Configuration shall support hot reload without restarting the gateway.

---

# 24. Future Enhancements

The Routing Engine is designed to support:

- gRPC routing
- WebSocket routing
- GraphQL gateway
- Canary deployments
- Blue/Green deployments
- Geographic routing
- Traffic shadowing
- Service mesh integration
- Dynamic plugin routing
- AI-assisted request routing

These features must be additive and not require redesign of the routing core.

---

# 25. Related Documents

- API-GATEWAY.md
- REQUEST-LIFECYCLE.md
- MIDDLEWARE-PIPELINE.md
- TENANT-RESOLUTION.md
- API-VERSIONING.md
- SERVICE-COMMUNICATION.md
- NETWORK-TOPOLOGY.md
- ARCHITECTURE-DECISIONS.md