# SJ Cloud

> Enterprise Multi-Tenant Platform-as-a-Service (PaaS) and Digital Infrastructure Platform

---

## Overview

SJ Cloud is the centralized cloud platform that powers the deployment, operation, and lifecycle management of software products across the SJ Cloud ecosystem.

It provides a standardized, secure, and scalable infrastructure for hosting:

- Commercial SaaS applications
- Government digital services
- NGO platforms
- Enterprise systems
- Internal business applications
- Third-party software solutions

SJ Cloud is designed around modern platform engineering principles, enabling multiple independent tenants to share a common cloud infrastructure while maintaining strong isolation, operational consistency, and security.

This repository contains the infrastructure standards, architecture documentation, operational procedures, and deployment assets that define the SJ Cloud platform.

---

# Vision

To provide a secure, scalable, and vendor-neutral cloud platform capable of supporting digital transformation initiatives across government, enterprise, education, non-profit organizations, and commercial software providers.

SJ Cloud aims to eliminate infrastructure fragmentation by delivering a unified deployment platform built on open technologies and standardized operational practices.

---

# Core Principles

The platform is designed around the following engineering principles:

- Infrastructure as Code
- Container-First Architecture
- Security by Default
- Multi-Tenant Isolation
- Immutable Infrastructure
- Standardized Deployments
- High Availability
- Observability First
- Automation over Manual Operations
- Documentation as an Engineering Asset

---

# Platform Capabilities

SJ Cloud provides infrastructure services including:

- Multi-tenant application hosting
- Reverse proxy and traffic management
- Automatic TLS management
- Container orchestration
- PostgreSQL database hosting
- Redis caching
- Object storage
- Monitoring and alerting
- Centralized logging
- CI/CD automation
- Secrets management
- Backup and disaster recovery
- Infrastructure observability

---

# Repository Scope

This repository manages the shared infrastructure powering the SJ Cloud platform.

It is **not** intended to contain application source code.

Business applications are maintained in dedicated repositories and consume this platform during deployment.

Examples include:

```
github.com/sj-cloud/carecore
github.com/sj-cloud/startupjigawa
github.com/sj-cloud/packages-auth
github.com/sj-cloud/platform
```

---

# Platform Architecture

```
                    Cloudflare
                         │
                         ▼
                    Traefik Proxy
                         │
        ┌───────────────────────────────────┐
        │                                   │
        ▼                                   ▼
   Application Containers             Platform Services
                                           │
         ┌──────────────┬─────────────┬──────────────┐
         ▼              ▼             ▼              ▼
    PostgreSQL       Redis         MinIO       Monitoring Stack
```

The architecture is designed for portability and progressive scaling.

Current deployments use Docker Compose while preserving compatibility with future Kubernetes migration.

---

# Deployment Strategy

SJ Cloud follows a phased infrastructure evolution.

| Phase | Platform |
|--------|----------|
| Phase 1 | Docker Compose |
| Phase 2 | Multi-VPS Infrastructure |
| Phase 3 | Docker Swarm (Optional) |
| Phase 4 | Kubernetes |

Applications are designed to remain portable throughout each phase without requiring architectural redesign.

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Operating System | Ubuntu Server 24.04 LTS |
| Container Runtime | Docker Engine |
| Orchestration | Docker Compose |
| Future Orchestration | Kubernetes |
| Reverse Proxy | Traefik v3 |
| CDN & DNS | Cloudflare |
| Backend | Laravel 11 / PHP 8.3+ |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL 17 |
| Cache | Redis |
| Object Storage | MinIO |
| Monitoring | Prometheus |
| Visualization | Grafana |
| Logging | Loki |
| Mail Testing | Mailpit |
| CI/CD | GitHub Actions |
| Version Control | GitHub |

---

# Repository Structure

```
sj-cloud/

docs/
standards/
architecture/
adr/
rfc/
onboarding/
runbooks/
```

Detailed documentation for each area is available inside the `docs` directory.

---

# Documentation

The documentation is organized into six major areas.

| Directory | Purpose |
|------------|---------|
| standards | Engineering standards |
| architecture | Platform architecture |
| adr | Architecture Decision Records |
| rfc | Engineering proposals |
| onboarding | Developer onboarding |
| runbooks | Operational procedures |

---

# Security

Security is a foundational design principle.

The platform adopts:

- Least privilege access
- Zero trust networking principles
- Secure defaults
- TLS encryption
- Infrastructure isolation
- Automated certificate management
- Secret management
- Continuous monitoring
- Infrastructure auditing

Operational security standards are documented separately.

---

# Development Workflow & Commands

Infrastructure and application managers can use the standard `Makefile` targets to build, validate, and test the platform.

### Development Commands
- **Initialize environment**: `make init`
- **Setup networks**: `make network`
- **Deploy Ingress stack**: `make deploy`
- **Deploy Service Mesh stack**: `make mesh`

### Application Build & Deployment Commands
- **Register Application**: `make app-create ID=<app-id> TENANT=<tenant-id>`
- **Compile Application Image**: `make app-build ID=<app-id>`
- **Deploy Release Version**: `make app-deploy ID=<app-id> RELEASE=<release-id>`
- **Rollback Application**: `make app-rollback ID=<app-id> RELEASE=<release-id>`
- **Restart Application Service**: `make app-restart ID=<app-id>`
- **Check Application Runtime Status**: `make app-status ID=<app-id>`
- **Query Application Metrics**: `make app-metrics ID=<app-id>`

### Validation Commands
- **Validate Ingress Proxy Settings**: `make validate`
- **Validate Service Mesh Registry**: `make validate-services`
- **Validate Application Manager schemas**: `make app-validate`

### Testing Commands
- **Run Service Mesh Integration Tests**: `make mesh-test`
- **Run Tenant Lifecycle Integration Tests**: `make tenant-test`
- **Run Application Lifecycle Integration Tests**: `make app-test`

---

# Completed Milestones
- **Milestones 1–3**: Ingress foundations and core networking.
- **Milestones 4–6.5**: Service Mesh, telemetry, DNS, and traffic routing.
- **Milestones 7–7.5**: Tenant Lifecycle Engine and Production Hardening.
- **Milestone 8**: Application Runtime & Deployment Engine (PaaS execution plane).

---

# License

MIT License. See [LICENSE](LICENSE) for more details.

---

# Roadmap

Platform evolution roadmap:

- [x] Automated tenant provisioning
- [x] Platform APIs
- [x] Application Runtime & Deployments
- [ ] Kubernetes Multi-Cluster execution plane
- [ ] Self-service developer control dashboard

---

# Maintained By

SJ Cloud Engineering  
Platform Engineering Team  

Copyright © 2026 SJ Cloud. Licensed under the MIT License.