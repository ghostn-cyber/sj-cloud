# Platform Architecture

**Document ID:** ARC-PLATFORM-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Architecture

**Owner:** Platform Engineering

**Related Standards:**
- ISS-001
- STD-NETWORK-001
- STD-SECURITY-001
- STD-DEPLOYMENT-001

---

# 1. Purpose

This document defines the logical architecture of the SJ Cloud Platform.

It describes the major architectural layers, platform services, tenant services, shared infrastructure, and interactions between system components.

This document intentionally avoids implementation-specific configuration and instead focuses on the structural design of the platform.

---

# 2. Architectural Vision

SJ Cloud is designed as a **layered, multi-tenant Platform-as-a-Service (PaaS)** that provides reusable infrastructure and operational services for multiple independent organizations.

The architecture emphasizes:

- Reusability
- Scalability
- Tenant Isolation
- Security
- Automation
- Observability
- Portability

The platform is designed to evolve from Docker Compose deployments to Kubernetes without requiring application redesign.

---

# 3. Architecture Principles

The platform follows the following architectural principles:

- Layered Architecture
- Shared Platform Services
- Multi-Tenant by Design
- Infrastructure as Code
- API-First Design
- Event-Driven Where Appropriate
- Least Privilege
- Secure by Default
- Stateless Services
- Independent Scalability

---

# 4. Architecture Layers

SJ Cloud consists of six logical layers.

```
┌──────────────────────────────┐
│ Layer 1  Edge                │
├──────────────────────────────┤
│ Layer 2  Gateway             │
├──────────────────────────────┤
│ Layer 3  Platform Services   │
├──────────────────────────────┤
│ Layer 4  Tenant Services     │
├──────────────────────────────┤
│ Layer 5  Data Services       │
├──────────────────────────────┤
│ Layer 6  Operations          │
└──────────────────────────────┘
```

Each layer has clearly defined responsibilities and communicates only through approved interfaces.

---

# 5. Layer 1 — Edge

The Edge layer is the public entry point into SJ Cloud.

Responsibilities:

- DNS
- CDN
- DDoS Protection
- TLS
- WAF
- Rate Limiting
- Global Traffic Distribution

Technology:

- Cloudflare

All external traffic MUST enter through the Edge layer.

---

# 6. Layer 2 — Gateway

The Gateway layer routes incoming requests to the appropriate platform or tenant service.

Responsibilities:

- Reverse Proxy
- HTTPS Termination
- Routing
- Middleware
- Request Filtering
- Load Balancing
- Service Discovery

Technology:

- Traefik v3

The Gateway layer represents the boundary between public and private infrastructure.

---

# 7. Layer 3 — Platform Services

Platform Services provide reusable capabilities shared across all tenants.

Core platform services include:

- Identity & Authentication
- Authorization
- Tenant Registry
- Platform API
- Notification Service
- Certificate Management
- File Management
- Shared Logging
- Monitoring
- Metrics Collection
- Mail Services
- Secrets Management

Platform Services are independent of any individual tenant.

---

# 8. Layer 4 — Tenant Services

Tenant Services represent customer applications deployed on SJ Cloud.

Examples include:

- Startup Jigawa
- CareCore
- NGO Platforms
- Government Services
- Commercial SaaS Applications

Each tenant is independently deployable and operates within its own logical boundary.

Tenants consume Platform Services rather than implementing common infrastructure independently.

---

# 9. Layer 5 — Data Services

The Data Services layer provides persistent storage for the platform.

Core components include:

- PostgreSQL
- Redis
- MinIO

Responsibilities:

- Relational Data
- Caching
- Object Storage
- Backup Integration
- Data Recovery

Applications interact with data services through approved interfaces.

---

# 10. Layer 6 — Operations

The Operations layer provides platform visibility and operational management.

Responsibilities:

- Monitoring
- Metrics
- Logging
- Alerting
- Backup
- Restore
- Incident Response
- Capacity Planning
- Platform Maintenance

Core technologies:

- Prometheus
- Grafana
- Loki
- GitHub Actions

---

# 11. Component Relationships

```
                   Internet
                        │
                 Cloudflare Edge
                        │
                        ▼
                  Traefik Gateway
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
 Platform API      Tenant Apps      Auth Service
      │                 │                 │
      └────────────┬────┴────┬────────────┘
                   ▼         ▼
            Shared Platform Services
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
 PostgreSQL     Redis        MinIO
                   │
                   ▼
      Prometheus • Grafana • Loki
```

---

# 12. Communication Model

The platform uses a request-response communication model for synchronous interactions.

Characteristics:

- HTTP/HTTPS APIs
- Internal service discovery
- Private networking
- Stateless service communication

Future platform capabilities MAY introduce asynchronous messaging where appropriate.

---

# 13. Scalability Model

Each layer SHALL scale independently.

Examples:

- Additional Traefik instances
- Multiple application containers
- Database replication
- Redis clustering
- Object storage expansion

This architecture avoids unnecessary coupling between services.

---

# 14. Multi-Tenant Architecture

Multi-tenancy is implemented through logical isolation.

Isolation applies to:

- Applications
- Configuration
- Secrets
- Databases
- Storage
- Networking

Shared platform services remain common across all tenants.

---

# 15. Security Boundaries

Security boundaries exist between:

- Internet and Edge
- Edge and Gateway
- Gateway and Internal Services
- Tenant Services and Platform Services
- Applications and Data Services

Each boundary enforces authentication, authorization, and network segmentation as defined in the platform security standards.

---

# 16. Deployment Evolution

The logical architecture remains stable across deployment models.

| Phase | Deployment |
|--------|------------|
| Phase 1 | Docker Compose |
| Phase 2 | Multi-VPS |
| Phase 3 | Docker Swarm (Optional) |
| Phase 4 | Kubernetes |

Only the deployment infrastructure changes; the logical architecture remains consistent.

---

# 17. Architectural Constraints

The following constraints apply:

- No direct public database access
- No shared tenant databases
- No hardcoded infrastructure addresses
- No tenant-to-tenant communication unless explicitly approved
- No platform service dependencies on tenant applications

---


# 18. Network Architecture

### 18.1 Segmentation Model

The platform's control plane (`platform/tenant-manager/control-plane`) and runtime plane (`platform/tenant-manager/runtime-plane`) both operate within the six-network segmentation model defined in `docs/architecture/NETWORK-TOPOLOGY.md`:

| Plane Component | Primary Network |
|---|---|
| Provisioning, registry, policy, quotas, domain, secrets, audit, billing, monitoring (control-plane submodules) | `sj-services` (as part of the API-Gateway-fronted service tier) |
| Applications, databases, cache, storage, networking (runtime-plane submodules) | `sj-services` and `sj-data`, per component |

The control plane never talks to tenant runtime containers directly over a public route — provisioning and lifecycle actions happen through internal service calls (SERVICE-COMMUNICATION.md), and the resulting tenant is exposed to the internet only via Traefik + the tenant's assigned domain (DNS-ARCHITECTURE.md).

### 18.2 API Gateway as Platform Boundary

`services/api-gateway` is the single public entry point for all platform and tenant API traffic. It is the enforcement point for the platform's multi-tenancy guarantee: a request is resolved to exactly one tenant context before it reaches any application or shared service. See `docs/architecture/TRAFFIC-FLOW.md` §2.4.

### 18.3 Domain Provisioning Integration

The control plane's `domain` module is the system of record for tenant DNS mappings (`config/tenants/<slug>/domain.yaml`), consumed by Traefik's dynamic configuration provider to add/remove tenant routing without a redeploy. This keeps tenant onboarding a data operation, consistent with "the platform must never hardcode tenant domains" (`docs/architecture/DNS-ARCHITECTURE.md` §3.2).

### 18.4 Observability & Backup Integration

- The control plane's `monitoring` module and the platform's `sj-monitoring` network are connected via scrape targets registered per service — see `NETWORK-TOPOLOGY.md` §3.5.
- Backup/restore for the runtime plane's `databases` and `storage` components runs entirely within the isolated `sj-backup` network — see `NETWORK-TOPOLOGY.md` §3.6.

### 18.5 Kubernetes Migration Note

The control-plane/runtime-plane split already maps cleanly onto separate Kubernetes namespaces (e.g., `control-plane` and per-tenant or shared `runtime` namespaces), which is the direction `docs/architecture/NETWORK-TOPOLOGY.md` §7 and `NETWORK-SECURITY.md` §8 assume for Phase 4.

Full networking detail is documented separately rather than duplicated here — see the six documents listed in `SYSTEM-OVERVIEW.md` §13.

---

# 19. Related Documents

- `SYSTEM-OVERVIEW.md`
- `NETWORK-TOPOLOGY.md`
- `SERVICE-COMMUNICATION.md`
- `DNS-ARCHITECTURE.md`
- `TRAFFIC-FLOW.md`
- `NETWORK-SECURITY.md`
- `NETWORK-NAMING.md`
- `TENANT-ARCHITECTURE.md`
- `STORAGE-ARCHITECTURE.md`
- `APPLICATION-RUNTIME.md`
- `APPLICATION-DEPLOYMENT.md`

---

# References

- ISS-001
- STD-NETWORK-001
- STD-SECURITY-001
- STD-DEPLOYMENT-001

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-07-29 | Initial release |
| 1.1 | 2026-07-30 | Integrated Milestone 3 Network Architecture |
| 1.2 | 2026-08-01 | Integrated Milestone 8 Application Runtime & Deployment Engine |

---

**Document Version:** 1.2

**Status:** Approved

**Owner:** SJ Cloud Platform Engineering

© SJ Cloud Platform Engineering. All Rights Reserved.