# API Versioning

**Document ID:** ARCH-API-001

**Status:** Approved

**Version:** 1.0

**Last Updated:** Milestone 5 — API Gateway Foundation

---

# 1. Purpose

This document defines the API versioning strategy for SJ Cloud.

The objective is to enable continuous platform evolution while maintaining backward compatibility for existing clients and tenant applications.

API versioning is enforced at the API Gateway before requests reach platform or tenant services.

---

# 2. Scope

This specification defines:

- Version identification
- Version lifecycle
- Version negotiation
- Compatibility rules
- Deprecation policy
- Sunset policy
- Migration strategy

This document does not define individual service endpoints.

---

# 3. Design Principles

The API versioning system shall be:

- Explicit
- Predictable
- Backward Compatible
- Gateway Enforced
- Service Independent
- Observable
- Tenant Aware

Breaking changes shall never be introduced into an existing major version.

---

# 4. Architectural Position

```
Client
   │
Cloudflare
   │
Traefik
   │
API Gateway
   │
Version Resolver
   │
Routing Engine
   │
Application Service
```

Version resolution occurs after tenant resolution and before route matching.

---

# 5. Version Format

SJ Cloud follows Semantic API Versioning.

```
v1

v2

v3
```

Only the major version is exposed in public URLs.

Internal services may track minor and patch releases independently.

---

# 6. URL Structure

All public APIs use URL-based versioning.

Example:

```
/api/v1/auth/login

/api/v1/storage/upload

/api/v2/storage/upload

/api/v1/search
```

The version identifier always follows `/api/`.

---

# 7. Version Resolution

The Version Resolver extracts the version from the request path.

Example:

```
/api/v1/auth/login

↓

Version = v1
```

If no version is present, the request is rejected.

---

# 8. Supported Versions

At any point in time, the platform maintains:

- Current Version
- Previous Version
- Deprecated Versions (optional)

Example:

| Version | Status |
|----------|---------|
| v3 | Current |
| v2 | Supported |
| v1 | Deprecated |

---

# 9. Default Behavior

SJ Cloud does not automatically infer API versions.

Requests without an explicit version return:

```
400 Bad Request
```

Example response:

```json
{
  "success": false,
  "code": "API_VERSION_REQUIRED",
  "message": "Specify an API version."
}
```

---

# 10. Breaking Changes

Breaking changes require a new major version.

Examples:

- Endpoint removal
- Authentication changes
- Response schema changes
- Request schema changes
- URL structure changes

Breaking changes shall never be introduced within an existing major version.

---

# 11. Non-Breaking Changes

The following changes are permitted within an existing version:

- Performance improvements
- Bug fixes
- Additional optional fields
- New endpoints
- Documentation updates
- Security improvements

Existing clients must continue functioning without modification.

---

# 12. Deprecation Policy

Deprecated versions remain operational for a defined support period.

Minimum support period:

```
12 Months
```

During deprecation:

- Documentation is updated.
- Clients receive warning headers.
- Migration guides are published.

---

# 13. Sunset Policy

After the support period expires:

- New development is prohibited.
- Security patches cease.
- Requests return an HTTP 410 Gone or another platform-defined response after the announced sunset date.

Sunset dates must be announced well in advance.

---

# 14. Version Negotiation

The API Gateway resolves versions solely from the URL.

Alternative mechanisms (such as headers or content negotiation) are not used for public APIs.

Future internal services may support additional negotiation mechanisms without affecting public interfaces.

---

# 15. Service Independence

Each service may evolve internally.

Example:

```
Storage Service

Internal Build:
1.8.14

↓

Public API

v1
```

Internal implementation versions are never exposed to clients.

---

# 16. Tenant Compatibility

API versions are platform-wide.

Tenants cannot redefine platform API versions.

However, feature availability may vary by tenant configuration or subscription plan.

---

# 17. Gateway Responsibilities

The API Gateway shall:

- Validate version format.
- Reject unsupported versions.
- Route requests to the correct service implementation.
- Apply version-specific middleware where required.
- Emit version metrics.

---

# 18. Metrics

The platform collects version usage statistics.

Metrics include:

- Requests per version
- Error rate by version
- Active clients
- Deprecated version usage
- Migration progress

These metrics support platform lifecycle management.

---

# 19. Error Responses

Standard responses include:

| Condition | Response |
|-----------|----------|
| Missing Version | 400 Bad Request |
| Unsupported Version | 404 Not Found |
| Deprecated Version | 200 + Warning Header |
| Sunset Version | 410 Gone |

Responses must follow the platform error specification.

---

# 20. Migration Strategy

Migration between versions follows four phases:

### Phase 1

New version released.

### Phase 2

Previous version marked as deprecated.

### Phase 3

Migration tooling and documentation provided.

### Phase 4

Deprecated version retired.

This process minimizes disruption for tenants and integrators.

---

# 21. Documentation Requirements

Every public API version must include:

- OpenAPI specification
- Changelog
- Migration guide
- Deprecation notice (if applicable)
- Example requests
- Example responses

Documentation is version-specific.

---

# 22. Future Evolution

The versioning framework is designed to support:

- Parallel API generations
- GraphQL APIs
- gRPC APIs
- Event-driven APIs
- WebSocket APIs
- Service Mesh integrations
- Multi-region deployments

These capabilities must remain compatible with the gateway's core version resolution model.

---

# 23. Related Documents

- API-GATEWAY.md
- REQUEST-LIFECYCLE.md
- ROUTING-ENGINE.md
- MIDDLEWARE-PIPELINE.md
- TENANT-RESOLUTION.md
- SERVICE-COMMUNICATION.md
- ARCHITECTURE-DECISIONS.md