# API Gateway Architecture

**Document ID:** ARCH-API-001

**Status:** Approved

**Version:** 1.0

**Last Updated:** Milestone 5 — API Gateway Foundation

---

# 1. Purpose

The API Gateway is the single logical entry point into the SJ Cloud platform.

It forms the security boundary between external clients and the internal platform services.

No service within SJ Cloud may be accessed directly from the public Internet unless explicitly routed through the API Gateway.

The gateway is responsible for routing, authentication, authorization, tenant resolution, request validation, observability, auditing, and traffic governance.

---

# 2. Scope

This document defines:

- Gateway responsibilities
- Gateway architecture
- Request processing model
- Service routing
- Tenant routing
- Security boundaries
- Service discovery
- Configuration model
- Failure handling
- Performance objectives

Implementation details are documented separately.

---

# 3. Architectural Position

The API Gateway sits directly behind Traefik.

```

Internet
│

Cloudflare CDN
│

Traefik (Edge Proxy)
│

API Gateway
│

Platform Services
│

Data Layer

```

Traefik performs TLS termination, edge routing, and basic ingress.

The API Gateway performs platform intelligence.

---

# 4. Responsibilities

The gateway is responsible for:

- Request normalization
- Request validation
- Correlation ID generation
- Request ID generation
- Authentication
- Authorization
- Tenant resolution
- API version resolution
- Rate limiting
- Routing
- Service discovery
- Response normalization
- Metrics collection
- Audit logging

The gateway must never contain business logic.

Business logic belongs to downstream services.

---

# 5. Platform Boundary

The API Gateway represents the official platform boundary.

Everything outside the gateway is considered untrusted.

Everything inside the gateway operates under platform trust policies.

No service shall bypass the gateway except:

- Prometheus scraping
- Internal backup operations
- Infrastructure maintenance
- Cluster health checks

---

# 6. Core Components

The gateway consists of independent modules.

```

API Gateway

├── Request Handler
├── Router
├── Tenant Resolver
├── Authentication
├── Authorization
├── Validation
├── Rate Limiter
├── Service Discovery
├── Audit Logger
├── Metrics Collector
├── Response Processor

```

Each module has exactly one responsibility.

---

# 7. Gateway Principles

The gateway follows these architectural principles:

- Stateless
- Horizontally scalable
- Configuration-driven
- Multi-tenant
- Secure by default
- Observable
- Extensible
- Zero Trust

---

# 8. Request Lifecycle

Every request follows the same lifecycle.

```

Incoming Request

↓

Normalize

↓

Generate Request ID

↓

Generate Correlation ID

↓

Resolve Tenant

↓

Resolve API Version

↓

Authenticate

↓

Authorize

↓

Validate

↓

Apply Rate Limits

↓

Locate Service

↓

Forward Request

↓

Receive Response

↓

Normalize Response

↓

Metrics

↓

Audit Log

↓

Return Response

```

No middleware may bypass this sequence.

---

# 9. Service Discovery

The gateway never hardcodes service addresses.

Instead, services are resolved through the platform registry.

Initially this registry is file-based.

Future implementations may use:

- Consul
- Kubernetes
- etcd
- Platform Registry API

without changing gateway logic.

---

# 10. Routing Model

Routing occurs in three stages.

## Stage 1

Determine tenant.

Possible sources:

- Host header
- Custom domain
- Platform subdomain
- Internal request header

---

## Stage 2

Determine API version.

Examples

```

/api/v1/users

/api/v2/users

```

---

## Stage 3

Determine destination service.

Examples

```

Auth

Storage

Notifications

Analytics

Tenant Application

```

---

# 11. Tenant Awareness

Every request belongs to exactly one tenant.

The gateway resolves the tenant before contacting any downstream service.

Resolved tenant context includes:

- Tenant ID
- Tenant Slug
- Domain
- Subscription
- Region
- Runtime Environment
- Feature Flags

Downstream services never perform domain resolution.

---

# 12. Authentication

Authentication verifies identity.

Supported mechanisms:

- JWT
- OAuth2
- API Keys
- Session Tokens
- Internal Service Tokens

Anonymous requests are allowed only where explicitly configured.

---

# 13. Authorization

Authorization determines permissions.

Authorization is policy-based.

Possible models:

- RBAC
- ABAC
- Scope-based
- Tenant roles

Policies are evaluated before routing.

---

# 14. Validation

Incoming requests shall be validated for:

- Method
- Headers
- Body
- Size
- Encoding
- Content Type
- Required Parameters

Malformed requests shall be rejected immediately.

---

# 15. Rate Limiting

Rate limiting protects platform resources.

Policies may apply by:

- IP Address
- User
- API Key
- Tenant
- Endpoint

Rate limiting occurs before routing.

---

# 16. Response Processing

Before responses leave the gateway:

- Security headers are added
- Errors are normalized
- Correlation IDs included
- Metrics updated
- Audit events recorded

---

# 17. Error Handling

Gateway errors use a standard format.

Example

```json
{
  "success": false,
  "code": "AUTHENTICATION_FAILED",
  "message": "Authentication required.",
  "request_id": "...",
  "correlation_id": "..."
}
```

Internal stack traces shall never be exposed.

---

# 18. Logging

Every request produces structured logs.

Minimum fields:

- Timestamp
- Request ID
- Correlation ID
- Tenant
- User
- Route
- Service
- Method
- Status
- Duration
- Client IP

Logs must be JSON.

---

# 19. Metrics

Gateway metrics include:

- Request count
- Success rate
- Error rate
- Latency
- Active requests
- Authentication failures
- Authorization failures
- Tenant distribution
- Service response time

Metrics are exposed through Prometheus.

---

# 20. Security

Gateway security includes:

- HTTPS only
- Security headers
- Request size limits
- Rate limiting
- TLS
- HSTS
- CSP
- Input validation
- Request sanitization

The gateway shall never trust client input.

---

# 21. High Availability

The gateway is stateless.

Multiple instances may run simultaneously.

Load balancing occurs at Traefik.

Session state shall never be stored in memory.

---

# 22. Performance Objectives

Target objectives:

| Metric | Target |
|---------|--------|
| Gateway Latency | <10 ms |
| Routing Decision | <2 ms |
| Authentication | <5 ms |
| Availability | 99.95% |
| Error Rate | <0.1% |

---

# 23. Configuration

Configuration shall be externalized.

Examples:

- Environment variables
- YAML
- Secrets
- Service Registry

No configuration shall be hardcoded.

---

# 24. Deployment

The gateway is deployed as a standalone container.

Network membership:

- sj-proxy
- sj-services

The gateway must never connect directly to:

- sj-data
- sj-backup

Database access occurs only through downstream services.

---

# 25. Future Evolution

The architecture supports future enhancements including:

- GraphQL Gateway
- WebSocket Gateway
- gRPC Proxy
- AI Request Routing
- Geographic Routing
- Canary Deployments
- Blue/Green Deployments
- Service Mesh Integration
- Kubernetes Native Service Discovery

These capabilities must not require redesign of the core gateway architecture.

---

# 26. Related Documents

- SYSTEM-OVERVIEW.md
- PLATFORM-ARCHITECTURE.md
- REQUEST-LIFECYCLE.md
- ROUTING-ENGINE.md
- MIDDLEWARE-PIPELINE.md
- TENANT-RESOLUTION.md
- API-VERSIONING.md
- NETWORK-TOPOLOGY.md
- NETWORK-SECURITY.md
- SERVICE-STANDARD.md
- PLATFORM-COMPLIANCE.md