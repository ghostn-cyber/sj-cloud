# Middleware Pipeline

**Document ID:** ARCH-MW-001

**Status:** Approved

**Version:** 1.0

**Last Updated:** Milestone 5 — API Gateway Foundation

---

# 1. Purpose

This document defines the middleware execution pipeline for the SJ Cloud API Gateway.

The middleware pipeline is responsible for processing every incoming request before it reaches any platform or tenant service.

The execution order is fixed and deterministic to ensure consistent security, observability, routing, and operational behavior across the platform.

---

# 2. Scope

This document defines:

- Middleware architecture
- Middleware execution order
- Middleware responsibilities
- Pipeline lifecycle
- Failure handling
- Extensibility model
- Performance objectives

This document does not define business logic, routing implementation, or tenant resolution algorithms.

---

# 3. Design Principles

The middleware pipeline follows these principles:

- Single Responsibility
- Deterministic Execution
- Stateless Processing
- Configuration-Driven Behavior
- Zero Trust
- Fail Fast
- Observable by Default
- Extensible

Every middleware performs exactly one responsibility.

---

# 4. Pipeline Overview

Every request entering the platform follows the same middleware sequence.

```
Incoming Request
        │
        ▼
Request ID
        │
        ▼
Correlation ID
        │
        ▼
Request Logger
        │
        ▼
Tenant Resolver
        │
        ▼
API Version Resolver
        │
        ▼
Authentication
        │
        ▼
Authorization
        │
        ▼
Rate Limiter
        │
        ▼
Request Validator
        │
        ▼
Routing Engine
        │
        ▼
Response Processor
        │
        ▼
Metrics Collector
        │
        ▼
Audit Logger
        │
        ▼
Outgoing Response
```

No middleware may bypass this sequence.

---

# 5. Middleware Categories

The middleware pipeline consists of four logical layers.

```
Request Processing

↓

Identity

↓

Traffic Governance

↓

Routing

↓

Response Processing
```

---

# 6. Layer 1 — Request Processing

Responsible for preparing incoming requests.

Includes:

- Request ID Generation
- Correlation ID
- Logging
- Header Normalization
- Request Context Creation

Output:

A normalized platform request context.

---

# 7. Layer 2 — Identity

Responsible for establishing identity and tenant context.

Includes:

- Tenant Resolution
- API Version Resolution
- Authentication
- Authorization

Output:

Verified identity and tenant context.

---

# 8. Layer 3 — Traffic Governance

Responsible for protecting platform resources.

Includes:

- Rate Limiting
- Request Validation
- Payload Validation
- Request Size Validation
- Timeout Policies

Output:

Validated and policy-compliant request.

---

# 9. Layer 4 — Routing

Responsible for forwarding requests.

Includes:

- Route Matching
- Service Discovery
- Forwarding
- Retry Policy
- Circuit Breaker (future)

Output:

Destination service response.

---

# 10. Layer 5 — Response Processing

Responsible for standardizing outgoing responses.

Includes:

- Security Headers
- Response Normalization
- Metrics
- Audit Logging

Output:

Platform-compliant response.

---

# 11. Middleware Responsibilities

| Middleware | Responsibility |
|------------|----------------|
| Request ID | Generate unique request identifier |
| Correlation ID | Enable distributed tracing |
| Logger | Capture structured request logs |
| Tenant Resolver | Determine tenant context |
| Version Resolver | Resolve requested API version |
| Authentication | Verify caller identity |
| Authorization | Verify permissions |
| Rate Limiter | Protect platform resources |
| Validator | Validate request structure |
| Router | Resolve destination service |
| Response Processor | Normalize responses |
| Metrics | Export telemetry |
| Audit | Persist security events |

---

# 12. Request Context

The first middleware creates a request context shared by all subsequent middleware.

Example:

```json
{
  "requestId": "...",
  "correlationId": "...",
  "tenant": {},
  "user": {},
  "route": {},
  "service": {},
  "metadata": {}
}
```

The context is immutable except by the middleware responsible for each field.

---

# 13. Middleware Interface

Every middleware implements the same contract.

Example:

```typescript
interface Middleware {

    name: string;

    priority: number;

    execute(context, next): Promise<void>;

}
```

Middleware must never call another middleware directly.

Pipeline execution is managed by the gateway.

---

# 14. Execution Rules

Each middleware must:

- Complete successfully.
- Modify only its assigned context.
- Return control to the pipeline.
- Stop execution on unrecoverable errors.

A middleware must never skip another middleware.

---

# 15. Short-Circuit Rules

Pipeline execution stops immediately when:

- Authentication fails.
- Authorization fails.
- Validation fails.
- Rate limit exceeded.
- Tenant cannot be resolved.
- Route cannot be resolved.

Example:

```
Authentication

↓

401 Unauthorized

↓

Pipeline Ends
```

No downstream middleware executes after failure.

---

# 16. Error Handling

Middleware returns standardized errors.

Example:

```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests.",
  "request_id": "...",
  "correlation_id": "..."
}
```

Internal implementation details must never be exposed.

---

# 17. Middleware Registration

Middleware is registered during gateway startup.

Example:

```yaml
pipeline:

  - request-id

  - correlation-id

  - logger

  - tenant

  - version

  - authentication

  - authorization

  - rate-limit

  - validation

  - routing

  - response

  - metrics

  - audit
```

Execution order is determined by registration order.

---

# 18. Configuration

Each middleware has independent configuration.

Example:

```yaml
authentication:

  enabled: true

rate-limit:

  enabled: true

  requests: 100

validation:

  enabled: true
```

Disabling one middleware must not affect the others.

---

# 19. Observability

Every middleware exposes metrics.

Examples:

- Execution Time
- Error Count
- Success Count
- Invocation Count

Metrics are exported to Prometheus.

---

# 20. Logging

Middleware logs:

- Start
- Completion
- Errors
- Duration

Logs use structured JSON.

---

# 21. Performance Objectives

| Metric | Target |
|----------|---------|
| Request ID | <0.1 ms |
| Authentication | <5 ms |
| Authorization | <2 ms |
| Validation | <1 ms |
| Routing | <2 ms |
| Total Middleware Time | <10 ms |

---

# 22. Security

Middleware must never:

- Execute business logic.
- Access databases directly.
- Modify unrelated context.
- Store request state in memory between requests.
- Expose secrets.

The pipeline operates under Zero Trust principles.

---

# 23. Extensibility

Future middleware may include:

- Web Application Firewall (WAF)
- Bot Detection
- IP Reputation
- Request Transformation
- Response Compression
- GraphQL Processing
- AI Request Classification
- OpenTelemetry Tracing
- Feature Flag Evaluation

New middleware must integrate without changing existing execution order unless explicitly approved through an Architecture Decision Record (ADR).

---

# 24. Future Evolution

The pipeline is designed to support:

- Plugin-based middleware loading
- Dynamic middleware configuration
- Per-route middleware stacks
- Tenant-specific middleware
- Canary middleware deployment
- WebSocket middleware
- gRPC interceptors
- Service Mesh integration

These capabilities must remain backward compatible with the core pipeline.

---

# 25. Related Documents

- API-GATEWAY.md
- REQUEST-LIFECYCLE.md
- ROUTING-ENGINE.md
- TENANT-RESOLUTION.md
- API-VERSIONING.md
- SERVICE-COMMUNICATION.md
- NETWORK-SECURITY.md
- ARCHITECTURE-DECISIONS.md