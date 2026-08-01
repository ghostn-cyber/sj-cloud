# Architecture Decisions

**Document ID:** ARCH-DECISIONS-001  
**Status:** Approved  
**Version:** 1.0.0  
**Last Updated:** Milestone 3 — Networking & DNS Architecture  
**Owner:** SJ Cloud Platform Engineering

---

# Purpose

This document provides a high-level index of the major architectural decisions that define SJ Cloud.

Unlike Architecture Decision Records (ADRs), which document individual decisions in detail, this document acts as a centralized reference for engineers, architects, auditors, and contributors.

Each entry summarizes:

- The architectural decision
- Current status
- Why the decision was made
- Primary documentation
- Related ADRs
- Future review requirements

This document should be updated whenever a significant architectural decision is accepted, superseded, or deprecated.

---

# Architecture Principles

All architectural decisions within SJ Cloud must support the following principles:

- Security by Default
- Infrastructure as Code
- Container First
- API First
- Multi-Tenant by Design
- Platform over Projects
- Explicit Documentation
- Least Privilege
- Zero Trust Networking
- Cloud Native Evolution
- Operational Simplicity
- Future Kubernetes Compatibility

---

# Architecture Decision Index

| ID | Decision | Status | Phase | Primary Reference |
|-----|----------|--------|-------|-------------------|
| ARCH-001 | Infrastructure as Code | Approved | Phase 1 | Infrastructure Standards |
| ARCH-002 | Container-First Platform | Approved | Phase 1 | SYSTEM-OVERVIEW.md |
| ARCH-003 | Multi-Tenant Platform Architecture | Approved | Phase 1 | PLATFORM-ARCHITECTURE.md |
| ARCH-004 | Docker Compose → Kubernetes Evolution | Approved | Phase 1 | PLATFORM-ARCHITECTURE.md |
| ARCH-005 | Traefik as Edge Reverse Proxy | Approved | Phase 4 | ADR-0002 |
| ARCH-006 | Cloudflare as Global Edge | Approved | Phase 3 | NETWORK-TOPOLOGY.md |
| ARCH-007 | API Gateway Pattern | Approved | Phase 3 | TRAFFIC-FLOW.md |
| ARCH-008 | Six-Network Segmentation Model | Approved | Phase 3 | NETWORK-TOPOLOGY.md |
| ARCH-009 | Internal Service Discovery | Approved | Phase 3 | SERVICE-COMMUNICATION.md |
| ARCH-010 | Zero Trust Network Model | Approved | Phase 3 | NETWORK-SECURITY.md |
| ARCH-011 | Dynamic Tenant Domain Resolution | Approved | Phase 3 | DNS-ARCHITECTURE.md |
| ARCH-012 | Service Registry | Approved | Phase 3 | SERVICE-COMMUNICATION.md |
| ARCH-013 | Tenant Registry | Approved | Phase 3 | PLATFORM-ARCHITECTURE.md |
| ARCH-014 | Observability Pipeline | Approved | Phase 3 | NETWORK-SECURITY.md |
| ARCH-015 | Backup Isolation | Approved | Phase 3 | NETWORK-TOPOLOGY.md |
| ARCH-016 | Platform Naming Standards | Approved | Phase 3 | NETWORK-NAMING.md |
| ARCH-017 | Docker API Compatibility Layer | Approved | Phase 4 | decisions/ARCH-017-docker-api-compatibility.md |
| ARCH-018 | Service Registry and Mesh Proxy | Approved | Phase 4 | decisions/ARCH-018-service-registry.md |

---

# Decision Summaries

---

## ARCH-001 — Infrastructure as Code

### Decision

All infrastructure must be defined as code.

### Rationale

Infrastructure should be reproducible, reviewable, and version-controlled.

### References

- Infrastructure Standards
- Deployment Standards

---

## ARCH-002 — Container-First Platform

### Decision

Every platform component executes inside containers.

### Rationale

Containers provide:

- Isolation
- Portability
- Consistent deployments
- Simplified scaling

### Future

The container model must remain compatible with Kubernetes.

---

## ARCH-003 — Multi-Tenant Platform

### Decision

SJ Cloud is a platform that hosts multiple independent tenants.

Startup Jigawa is the first tenant—not the platform itself.

### Benefits

- Customer isolation
- Shared infrastructure
- Operational efficiency
- Commercial scalability

### References

- PLATFORM-ARCHITECTURE.md
- TENANT-ARCHITECTURE.md

---

## ARCH-004 — Deployment Evolution

### Decision

Infrastructure evolves without architectural redesign.

Roadmap:

```
Local Development
        ↓
Single VPS
        ↓
Multi-VPS
        ↓
Private Cluster
        ↓
Kubernetes
```

### Rationale

Avoid premature complexity while preserving long-term scalability.

---

## ARCH-005 — Traefik as Edge Reverse Proxy

### Decision

Traefik is the platform's edge router.

### Responsibilities

- HTTPS termination
- Dynamic routing
- Automatic certificate management
- Tenant routing
- Middleware
- Service discovery

### Review

Future evaluation after Kubernetes migration.

---

## ARCH-006 — Cloudflare Edge

### Decision

Cloudflare is the public edge.

### Responsibilities

- DNS
- CDN
- WAF
- DDoS Protection
- TLS
- Edge caching

Cloudflare remains the only public DNS provider.

---

## ARCH-007 — API Gateway

### Decision

All external API traffic passes through a centralized API Gateway.

### Responsibilities

- Authentication
- Authorization
- Tenant Resolution
- API Versioning
- Request Validation
- Logging
- Metrics
- Rate Limiting
- Service Routing

No internal service is publicly exposed.

---

## ARCH-008 — Six-Network Architecture

### Decision

The platform is segmented into six dedicated networks.

```
sj-edge

sj-proxy

sj-services

sj-data

sj-monitoring

sj-backup
```

### Purpose

Provide isolation between:

- Public traffic
- Applications
- Shared services
- Databases
- Monitoring
- Backup

---

## ARCH-009 — Internal Service Discovery

### Decision

Internal communication uses Docker DNS.

Examples

```
http://auth

http://postgres

http://redis

http://notification
```

### Not Allowed

```
https://auth.startupjigawa.com
```

Internal services never depend on public DNS.

---

## ARCH-010 — Zero Trust Networking

### Decision

Every network boundary is treated as untrusted.

Traffic is explicitly allowed—not implicitly trusted.

Trust boundaries include:

- Internet
- Cloudflare
- Traefik
- API Gateway
- Shared Services
- Data Layer
- Backup Layer

---

## ARCH-011 — Dynamic Tenant Domains

### Decision

Tenant domains are resolved dynamically.

Supported:

Platform domains

```
tenant.startupjigawa.com
```

Custom domains

```
carecore.ng

portal.gov.ng

school.edu.ng
```

No tenant domain is hardcoded.

---

## ARCH-012 — Service Registry

### Decision

Every platform service has metadata.

Location

```
config/services/
```

Example

```
auth.yaml

storage.yaml

notification.yaml
```

Future automation depends on this registry.

---

## ARCH-013 — Tenant Registry

### Decision

Tenant metadata is maintained separately from services.

Responsibilities

- Domain ownership
- Routing
- Configuration
- Resource allocation
- Lifecycle management

The API Gateway resolves every request through the Tenant Registry.

---

## ARCH-014 — Observability

### Decision

Monitoring is mandatory.

Pipeline

```
Application

↓

Metrics

↓

Prometheus

↓

Grafana
```

Logs

```
Application

↓

Loki

↓

Grafana
```

Future

```
AlertManager

↓

Email

↓

Webhook

↓

Chat Integrations
```

---

## ARCH-015 — Backup Isolation

### Decision

Backups execute on a dedicated network.

```
sj-backup
```

The backup layer never participates in request processing.

Future

- Remote object storage
- Off-site replication
- Disaster Recovery

---

## ARCH-016 — Naming Standards

### Decision

All infrastructure follows standardized naming.

Examples

Networks

```
sj-services
```

Containers

```
sj-auth
```

Volumes

```
sj-postgres-data
```

Environment Variables

```
SJ_DATABASE_HOST
```

Consistent naming simplifies automation and operations.

---

## ARCH-017 — Docker API Compatibility Layer

### Decision

A standalone Node.js-based Docker API translation proxy will be deployed as a platform service sidecar to map legacy v1.24 client request paths to modern v1.40 headers, restoring Traefik container auto-discovery.

### Rationale

Upgrading Traefik or editing `/etc/docker/daemon.json` settings is restricted in local user space/sandbox environments.

### Future

The compatibility proxy will be decommissioned once direct client API version negotiation is natively supported or the system is migrated to Kubernetes.

---

## ARCH-018 — Service Registry and Mesh Proxy

### Decision

Decouple the control plane responsibilities from the runtime routing path. The Service Registry loader, validator, compiler, and API reside in the Control Plane and write a compiled snapshot JSON file. The Mesh Proxy consumes this snapshot via a hot-reloaded Runtime Cache, routing requests with zero runtime external API dependency.

### Rationale

Eliminates the network hop to a centralized Registry API in the live request path, reducing latency, preventing single-point-of-failure routing outages, and establishing a robust transition strategy to Kubernetes CRDs.

---

# Pending Architecture Decisions

These decisions remain under evaluation.

| ID | Decision | Planned Phase |
|-----|----------|--------------|
| ARCH-019 | Message Broker (RabbitMQ/Kafka/NATS) | Phase 5 |
| ARCH-020 | Kubernetes Deployment Strategy | Phase 6 |
| ARCH-021 | Multi-Region Disaster Recovery | Phase 6 |
| ARCH-022 | Identity Provider (Keycloak/OAuth2) | Phase 5 |
| ARCH-023 | Service Mesh Evaluation | Phase 6 |
| ARCH-024 | Secret Management (Vault/SOPS) | Phase 5 |

---

# Superseded Decisions

This section records deprecated architecture decisions.

| Decision | Replaced By | Date |
|----------|-------------|------|
| None | — | — |

---

# Related Documentation

## Core Architecture

- SYSTEM-OVERVIEW.md
- PLATFORM-ARCHITECTURE.md
- TENANT-ARCHITECTURE.md
- STORAGE-ARCHITECTURE.md

## Networking

- NETWORK-TOPOLOGY.md
- SERVICE-COMMUNICATION.md
- DNS-ARCHITECTURE.md
- TRAFFIC-FLOW.md
- NETWORK-SECURITY.md
- NETWORK-NAMING.md

## Standards

- DEPLOYMENT-STANDARD.md
- SECURITY-STANDARD.md
- NETWORK-STANDARD.md
- NAMING.md

## Governance

- ADR/
- RFC/
- RUNBOOKS/

---

# Review Policy

This document shall be reviewed:

- At the completion of every architecture milestone.
- Before major infrastructure changes.
- Before production releases.
- Before Kubernetes migration.
- After significant security or operational incidents.

Changes to any approved architecture decision must be accompanied by:

1. An updated Architecture Decision Record (ADR).
2. A corresponding RFC (where applicable).
3. Updates to all affected architecture documents.
4. Approval from the Platform Architecture Review process.

---

# Document Status

**Status:** Approved

This document serves as the authoritative index of architectural decisions for the SJ Cloud platform and should be considered the starting point for understanding why the platform is designed the way it is.ss