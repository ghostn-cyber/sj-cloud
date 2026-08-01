# Request Lifecycle

**Document ID:** ARCH-REQ-001

**Status:** Approved

**Version:** 1.1

**Last Updated:** Milestone 8 — Application Runtime & Deployment Engine (August 1, 2026)

---

# 1. Purpose

This document defines the complete lifecycle of every request entering the SJ Cloud Platform.

Every HTTP, HTTPS, WebSocket, gRPC, and future protocol request shall follow the same logical processing pipeline.

The purpose of a standardized request lifecycle is to ensure:

- Predictable request handling
- Consistent security enforcement
- Uniform observability
- Tenant isolation
- Platform scalability
- Operational consistency

This lifecycle is mandatory for every platform service.

---

# 2. Scope

This document applies to:

- Public APIs
- Internal APIs
- Platform Dashboard
- Tenant Applications
- Authentication Services
- Storage Services
- Shared Platform Services

This document does not describe business logic.

---

# 3. High-Level Flow

```
                    Client
                      │
                      ▼
                Cloudflare CDN
                      │
                      ▼
              Traefik Edge Proxy
                      │
                      ▼
                API Gateway
                      │
     ┌───────────────────────────────────┐
     │ Request Processing Pipeline       │
     └───────────────────────────────────┘
                      │
                      ▼
              Target Platform Service
                      │
                      ▼
             PostgreSQL / Redis / MinIO
                      │
                      ▼
                API Gateway
                      │
                      ▼
                Traefik
                      │
                      ▼
                    Client
```

---

# 4. Lifecycle Objectives

Every request shall:

- Be uniquely identifiable.
- Belong to one tenant.
- Pass security validation.
- Produce telemetry.
- Generate audit events where applicable.
- Produce structured logs.
- Return standardized responses.

---

# 5. Processing Stages

Every request progresses through fifteen sequential stages.

```
Receive
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

Rate Limit

↓

Route

↓

Execute Service

↓

Normalize Response

↓

Collect Metrics

↓

Return Response
```

No request may skip any mandatory stage.

---

# 6. Stage 1 — Receive Request

The request enters the platform through Cloudflare and Traefik.

Traefik forwards the request to the API Gateway.

Information received includes:

- HTTP Method
- URL
- Headers
- Body
- Client IP
- TLS Information

No application logic executes during this stage.

---

# 7. Stage 2 — Request Normalization

The gateway standardizes the request.

Normalization includes:

- Header normalization
- URL normalization
- Method validation
- Encoding verification
- Content-Type validation
- Maximum request size validation

Malformed requests are rejected immediately.

---

# 8. Stage 3 — Request Identification

Every request receives a globally unique Request ID.

Example:

```
req_7c9d2b9f84e14d83
```

The Request ID uniquely identifies one request.

It exists only for the lifetime of that request.

---

# 9. Stage 4 — Correlation ID

If a Correlation ID already exists, it is preserved.

Otherwise, a new Correlation ID is generated.

Example:

```
corr_01J4XM3P6QQ1H
```

Unlike the Request ID, a Correlation ID may span multiple internal services.

It enables distributed tracing.

---

# 10. Stage 5 — Tenant Resolution

The Tenant Resolver determines which tenant owns the request.

Resolution order:

1. Custom Domain
2. Platform Subdomain
3. Internal Routing Header
4. JWT Claims (future)

Once resolved, the Tenant Context becomes immutable.

Example:

```
Tenant ID

Tenant Slug

Subscription

Region

Environment

Features
```

---

# 11. Stage 6 — API Version Resolution

The gateway determines the requested API version.

Examples:

```
/api/v1/users

/api/v2/files
```

If omitted, the configured default version is applied.

Unsupported versions return:

```
HTTP 400

Unsupported API Version
```

---

# 12. Stage 7 — Authentication

Identity verification occurs before any service execution.

Supported mechanisms:

- JWT
- OAuth2
- API Keys
- Internal Tokens
- Session Cookies

Unauthenticated requests are rejected unless the endpoint explicitly permits anonymous access.

---

# 13. Stage 8 — Authorization

The platform verifies that the authenticated principal has permission to perform the requested operation.

Authorization models include:

- RBAC
- ABAC
- Scope-based Policies

Authorization decisions are independent of routing.

---

# 14. Stage 9 — Request Validation

The gateway validates:

- Headers
- Parameters
- Request Body
- File Size
- JSON Schema
- Required Fields

Invalid requests never reach downstream services.

---

# 15. Stage 10 — Rate Limiting

The request passes through the rate limiting engine.

Policies may apply by:

- User
- API Key
- Tenant
- Endpoint
- Client IP

Requests exceeding configured thresholds receive:

```
HTTP 429
Too Many Requests
```

---

# 16. Stage 11 — Routing

The Routing Engine selects the destination service.

Routing considers:

- Tenant
- API Version
- Service Registry
- Endpoint
- Route Policies

No service addresses are hardcoded.

---

# 17. Stage 12 — Service Execution

The gateway forwards the request.

Examples:

```
Auth

Storage

Analytics

Notifications

Tenant Runtime

Search
```

The downstream service executes business logic.

---

# 18. Stage 13 — Response Normalization

Before returning the response:

The gateway:

- Adds Security Headers
- Removes Internal Headers
- Normalizes Errors
- Injects Request ID
- Injects Correlation ID

Responses become platform-compliant.

---

# 19. Stage 14 — Metrics Collection

Metrics are recorded.

Examples:

- Duration
- Response Code
- Bytes Sent
- Bytes Received
- Service Latency
- Authentication Failures
- Tenant Usage

Metrics are exported through Prometheus.

---

# 20. Stage 15 — Response Delivery

The normalized response travels back through:

```
Gateway

↓

Traefik

↓

Cloudflare

↓

Client
```

The request lifecycle then ends.

---

# 21. Failure Handling

Failures may occur at any stage.

The gateway returns standardized responses.

Example:

```json
{
  "success": false,
  "code": "TENANT_NOT_FOUND",
  "message": "Unable to resolve tenant.",
  "request_id": "...",
  "correlation_id": "..."
}
```

Internal implementation details are never exposed.

---

# 22. Logging

Every stage produces structured events.

Minimum fields:

- Timestamp
- Request ID
- Correlation ID
- Tenant
- Route
- Service
- Method
- Status Code
- Duration
- Client IP

Logs must use JSON.

---

# 23. Observability

Each lifecycle stage contributes telemetry.

Supported telemetry includes:

- Metrics
- Logs
- Distributed Traces
- Audit Events

These outputs integrate with:

- Prometheus
- Grafana
- Loki
- OpenTelemetry (future)

---

# 24. Performance Objectives

| Metric | Target |
|---------|---------|
| Gateway Processing | <10 ms |
| Tenant Resolution | <2 ms |
| Authentication | <5 ms |
| Routing Decision | <2 ms |
| Response Normalization | <1 ms |

---

# 25. Security Considerations

The request lifecycle follows Zero Trust principles.

Every request is considered untrusted until:

- Tenant is resolved.
- Identity is verified.
- Authorization succeeds.
- Validation completes.

No downstream service shall repeat gateway responsibilities unless additional domain-specific validation is required.

---

# 26. Related Documents

- API-GATEWAY.md
- ROUTING-ENGINE.md
- MIDDLEWARE-PIPELINE.md
- TENANT-RESOLUTION.md
- API-VERSIONING.md
- NETWORK-SECURITY.md
- PLATFORM-COMPLIANCE.md
- SERVICE-STANDARD.md