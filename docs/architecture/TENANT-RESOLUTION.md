# Tenant Resolution

**Document ID:** ARCH-TENANT-001

**Status:** Approved

**Version:** 1.0

**Last Updated:** Milestone 5 — API Gateway Foundation

---

# 1. Purpose

This document defines how SJ Cloud identifies the tenant associated with every incoming request.

Tenant Resolution is the foundation of the platform's multi-tenant architecture. Every request must resolve to exactly one tenant context before business logic is executed.

Tenant resolution occurs before routing, authentication, authorization, and service execution.

---

# 2. Scope

This specification defines:

- Tenant identification
- Tenant lookup order
- Domain resolution
- Runtime context creation
- Failure handling
- Tenant isolation
- Future extensibility

This document does not define authentication or routing behavior.

---

# 3. Architectural Position

```
Client
   │
Cloudflare
   │
Traefik
   │
API Gateway
   │
Tenant Resolution
   │
Tenant Context
   │
Middleware Pipeline
   │
Routing Engine
   │
Application
```

Tenant Resolution executes exactly once per request.

---

# 4. Design Principles

The tenant resolver shall be:

- Deterministic
- Stateless
- Configuration-driven
- Cache-aware
- Horizontally scalable
- Secure
- Fast

A request must never resolve to more than one tenant.

---

# 5. Resolution Sources

The resolver evaluates requests in the following order:

1. Custom Domain
2. Platform Subdomain
3. Internal Routing Header
4. Signed Tenant Token (future)
5. Explicit Tenant Identifier (internal services only)

The first successful match terminates resolution.

---

# 6. Custom Domain Resolution

Organizations may attach their own domains.

Examples:

```
academy.example.org

portal.company.com

school.ng
```

The resolver checks the Domain Registry for ownership.

Example:

```
academy.example.org

↓

Tenant Registry

↓

Tenant ID: tenant-102
```

---

# 7. Platform Subdomain Resolution

If no custom domain is found, the resolver checks platform-managed domains.

Examples:

```
carecore.startupjigawa.com

ngo.startupjigawa.com

labs.startupjigawa.com
```

The hostname is mapped to the registered tenant.

---

# 8. Development Domains

Local development uses the `.test` top-level domain.

Examples:

```
carecore.test

startupjigawa.test

ngo-portal.test
```

Development resolution follows the same algorithm as production.

---

# 9. Internal Service Resolution

Internal platform services communicate using trusted headers.

Example:

```
X-Tenant-ID

X-Tenant-Slug
```

These headers are accepted only from trusted internal networks and are stripped from external requests.

---

# 10. Tenant Registry

The Tenant Registry is the authoritative source for tenant metadata.

Minimum fields include:

```yaml
tenant_id:
slug:
display_name:
status:
plan:
primary_domain:
custom_domains:
environment:
region:
runtime:
database:
storage_bucket:
features:
```

The registry may be backed by configuration files during development and a database in production.

---

# 11. Tenant Context

After successful resolution, a Tenant Context is created.

Example:

```json
{
  "id": "tenant-102",
  "slug": "carecore",
  "plan": "enterprise",
  "environment": "production",
  "region": "ng-west",
  "runtime": "runtime-carecore",
  "database": "carecore_db",
  "storage": "carecore-bucket"
}
```

The context is immutable for the lifetime of the request.

---

# 12. Tenant Isolation

Every tenant receives isolated resources.

Isolation applies to:

- Database
- Cache
- Object Storage
- Secrets
- Runtime Containers
- Configuration
- Metrics
- Logs

No tenant may access another tenant's resources.

---

# 13. Domain Registry

The Domain Registry maintains domain ownership.

Example:

| Domain | Tenant |
|---------|--------|
| startupjigawa.com | startupjigawa |
| carecore.startupjigawa.com | carecore |
| academy.example.org | academy |

The registry is the only source of domain ownership.

---

# 14. Caching

Tenant lookups may be cached.

Recommended cache:

- Redis
- Local in-memory cache (short TTL)

Suggested TTL:

```
300 seconds
```

Cache invalidation occurs when:

- Domain changes
- Tenant suspension
- Plan updates
- Runtime migration

---

# 15. Failure Handling

Resolution fails when:

- Domain is unknown
- Tenant is suspended
- Registry unavailable
- Tenant deleted
- Invalid configuration

Standard responses:

| Failure | Response |
|----------|----------|
| Unknown Tenant | 404 |
| Suspended Tenant | 403 |
| Registry Failure | 503 |
| Invalid Configuration | 500 |

---

# 16. Security

External clients may never specify arbitrary tenant identifiers.

Only trusted infrastructure may inject internal tenant headers.

Tenant ownership is always verified against the registry.

---

# 17. Performance Objectives

| Metric | Target |
|---------|--------|
| Domain Lookup | <2 ms |
| Cache Lookup | <1 ms |
| Registry Query | <5 ms |
| Context Creation | <1 ms |
| Total Resolution | <5 ms |

---

# 18. Future Evolution

The tenant resolver is designed to support:

- Geographic tenant routing
- Multi-region failover
- Tenant migration
- Cross-region replication
- Federated tenant registries
- Kubernetes namespace resolution
- Service mesh integration

These capabilities must not change the public resolution algorithm.

---

# 19. Related Documents

- API-GATEWAY.md
- REQUEST-LIFECYCLE.md
- ROUTING-ENGINE.md
- MIDDLEWARE-PIPELINE.md
- API-VERSIONING.md
- DNS-ARCHITECTURE.md
- SERVICE-COMMUNICATION.md
- ARCHITECTURE-DECISIONS.md