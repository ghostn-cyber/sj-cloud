# System Overview

**Document ID:** ARC-SYSTEM-001

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

This document provides a high-level overview of the SJ Cloud Platform.

It defines the platform's mission, scope, primary capabilities, stakeholders, and conceptual architecture. It serves as the entry point for engineers, architects, implementation partners, auditors, and decision-makers seeking to understand the overall system.

Detailed implementation guidance is provided in subsequent architecture documents.

---

# 2. Platform Overview

SJ Cloud is a **multi-tenant Platform-as-a-Service (PaaS)** that provides the infrastructure, runtime, and operational services required to deploy, operate, secure, and manage modern digital applications.

The platform enables Startup Jigawa, government institutions, NGOs, enterprises, and commercial organizations to deploy and operate applications using a common cloud foundation.

SJ Cloud is designed as an internal cloud platform that can also support external tenants and commercial services.

---

# 3. Vision

To provide a secure, scalable, and standards-driven cloud platform that accelerates digital transformation through reusable infrastructure and shared platform capabilities.

---

# 4. Mission

SJ Cloud exists to:

- Standardize application deployment.
- Simplify infrastructure operations.
- Reduce operational complexity.
- Improve security.
- Enable multi-tenant hosting.
- Accelerate product delivery.
- Provide a foundation for future cloud-native services.

---

# 5. Strategic Objectives

The platform is designed to:

- Host multiple independent tenants.
- Support government digital services.
- Support NGO digital platforms.
- Host Startup Jigawa products.
- Enable commercial SaaS offerings.
- Provide shared platform capabilities.
- Reduce duplicated infrastructure.
- Support future Kubernetes adoption.

---

# 6. Platform Scope

SJ Cloud provides:

- Application hosting
- Container orchestration (Docker Compose today, Kubernetes in the future)
- Reverse proxy services
- Identity and access support
- Shared networking
- Shared monitoring
- Centralized logging
- Object storage
- Database hosting
- Cache services
- CI/CD integration
- Operational tooling

SJ Cloud does not provide traditional shared web hosting or cPanel-style hosting.

---

# 7. Stakeholders

Primary stakeholders include:

- Platform Engineering
- DevOps Engineers
- Backend Engineers
- Frontend Engineers
- Security Team
- Operations Team
- Infrastructure Administrators
- Startup Jigawa Delivery Team
- Government Partners
- NGOs
- Enterprise Clients
- System Integrators
- External Contractors

---

# 8. Tenant Model

SJ Cloud is a **multi-tenant platform**.

Each tenant represents an independent organization or product deployed on the shared platform.

Examples of tenants include:

- Startup Jigawa
- CareCore
- Government digital services
- NGO platforms
- Commercial SaaS applications

Each tenant maintains logical isolation while benefiting from shared platform services.

---

# 9. Shared Platform Services

The platform provides common services used across tenants:

- Reverse Proxy
- Identity and Authentication
- Monitoring
- Logging
- Object Storage
- Database Services
- Cache Services
- Certificate Management
- Deployment Automation

These services reduce duplication and improve operational consistency.

---

# 10. High-Level Conceptual Architecture

```
                   Internet
                       │
                Cloudflare Edge
                       │
                       ▼
                  Traefik Proxy
                       │
      ┌────────────────┼────────────────┐
      │                │                │
 Platform Services   Tenant Apps   Shared Services
      │                │                │
      └───────────────┬─────────────────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
     PostgreSQL     Redis       MinIO
                      │
                      ▼
          Monitoring & Logging
```

This conceptual model is independent of deployment technology.

---

# 11. Deployment Evolution

The platform follows a phased deployment strategy:

| Phase | Deployment Model |
|--------|------------------|
| Phase 1 | Docker Compose (Single VPS) |
| Phase 2 | Docker Compose (Multi-VPS) |
| Phase 3 | Docker Swarm (Optional) |
| Phase 4 | Kubernetes |

Platform architecture SHALL remain portable across these phases.

---

# 12. Technology Stack

| Layer | Technology |
|--------|------------|
| CDN / DNS | Cloudflare |
| Reverse Proxy | Traefik v3 |
| Containers | Docker |
| Future Orchestration | Kubernetes |
| Operating System | Ubuntu Server 24.04 LTS |
| Backend | Laravel 11 / PHP 8.3+ |
| Frontend | React + TypeScript + Tailwind CSS |
| Database | PostgreSQL 17 |
| Cache | Redis |
| Object Storage | MinIO |
| Monitoring | Prometheus |
| Dashboards | Grafana |
| Logging | Loki |
| Mail Testing | Mailpit |
| CI/CD | GitHub Actions |

---

# 13. Networking

SJ Cloud's networking is built on six purpose-scoped Docker networks that map directly onto the request lifecycle and, later, onto Kubernetes namespaces:

```
sj-edge → sj-proxy → sj-services → sj-data
                          │
                          ├──→ sj-monitoring (scrape-only)
                          └──→ sj-backup (data agents only)
```

- **`sj-edge`** — the only network with a host-published port (80/443), owned exclusively by Traefik.
- **`sj-proxy`** — routing tier; Traefik forwards to the API Gateway and other directly-routable platform front doors (Dashboard, docs, status).
- **`sj-services`** — where tenant applications and shared services (auth, notifications, queue, search, storage, analytics, audit) run, fronted exclusively by the API Gateway.
- **`sj-data`** — PostgreSQL, Redis, MinIO; reachable only from `sj-services`.
- **`sj-monitoring`** — Prometheus, Grafana, Loki; scrapes across tiers via read-only metrics endpoints only.
- **`sj-backup`** — isolated backup/restore agents; reachable only from `sj-data`, never from the request-serving path.

All internal service-to-service communication uses Docker's internal DNS (e.g., `http://auth`, `http://postgres`) rather than public URLs — see `docs/architecture/SERVICE-COMMUNICATION.md`.

DNS is organized into three tiers — corporate (`startupjigawa.com`), fixed platform subdomains (`api.`, `auth.`, `admin.`, etc.), and dynamic tenant domains (both platform-issued `<slug>.startupjigawa.com` and tenant-owned custom domains) — with tenant domains never hardcoded into platform code. See `docs/architecture/DNS-ARCHITECTURE.md`.

The full request path is:

```
Internet → Cloudflare → Traefik → API Gateway → Application → Shared Services → Database → Storage
```

Full detail, security posture, and naming conventions live in the dedicated documents:

- `docs/architecture/NETWORK-TOPOLOGY.md`
- `docs/architecture/SERVICE-COMMUNICATION.md`
- `docs/architecture/DNS-ARCHITECTURE.md`
- `docs/architecture/TRAFFIC-FLOW.md`
- `docs/architecture/NETWORK-SECURITY.md`
- `docs/architecture/NETWORK-NAMING.md`

This networking model is Milestone 3's deliverable and is a prerequisite for Milestone 4 (Reverse Proxy & Traefik implementation).

---

# 14. Architectural Principles

SJ Cloud follows these principles:

- Multi-tenancy
- Security by Design
- Infrastructure as Code
- Automation First
- Portability
- Least Privilege
- Observability
- Standardization
- Scalability
- High Availability (where applicable)

---

# 15. Availability and Resilience

The platform is designed to:

- Minimize downtime.
- Support rolling deployments.
- Enable service recovery.
- Support backup and restoration.
- Recover from infrastructure failures.

Higher availability targets will evolve as the platform transitions to clustered deployments.

---

# 16. Security Overview

Security is implemented through multiple layers:

- Cloudflare edge protection
- Secure reverse proxy
- Private internal networking
- Identity and access controls
- Secrets management
- TLS encryption
- Continuous monitoring
- Audit logging

Implementation requirements are defined in `STD-SECURITY-001`.

---

# 17. Operational Model

Platform operations include:

- Continuous deployment
- Infrastructure monitoring
- Centralized logging
- Backup management
- Certificate management
- Incident response
- Capacity planning
- Platform maintenance

Operational procedures are documented in the runbooks.

---

# 18. Related Architecture Documents

This document is supported by:

- `PLATFORM-ARCHITECTURE.md`
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

# 19. References

- ISS-001
- STD-NETWORK-001
- STD-SECURITY-001
- STD-DEPLOYMENT-001
- STD-DOCUMENTATION-001

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-07-29 | Initial release |
| 1.1 | 2026-07-30 | Integrated Milestone 3 Networking & DNS Architecture |
| 1.2 | 2026-08-01 | Integrated Milestone 8 Application Runtime & Deployment Engine |

---

**Document Version:** 1.2

**Status:** Approved

**Owner:** Platform Engineering

© SJ Cloud Platform Engineering. All Rights Reserved.