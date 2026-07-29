# Service Communication Architecture

**Document ID:** ARC-COMMUNICATION-001

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

This document defines how services communicate within the SJ Cloud Platform.

It describes communication patterns, routing, service discovery, trust boundaries, authentication, and the evolution of service communication from Docker Compose deployments to Kubernetes.

This document intentionally avoids mandating a specific service mesh implementation.

---

# 2. Objectives

The service communication architecture is designed to:

- Enable reliable service-to-service communication.
- Maintain tenant isolation.
- Support secure communication.
- Minimize operational complexity.
- Enable platform scalability.
- Prepare for Kubernetes-native networking.
- Maintain portability across deployment phases.

---

# 3. Communication Principles

SJ Cloud follows these principles:

- Private-by-default communication.
- Service discovery instead of static IP addresses.
- API-first integration.
- Stateless services.
- Secure communication.
- Least privilege.
- Loose coupling.
- Independent deployment.
- Observable communication.

---

# 4. Communication Layers

```
External Clients
        │
        ▼
Cloudflare Edge
        │
        ▼
Traefik Gateway
        │
        ▼
Platform Services
        │
        ▼
Tenant Services
        │
        ▼
Data Services
```

Each layer communicates only through approved interfaces.

---

# 5. Communication Types

## External Communication

Examples:

- Browser → Web Application
- Mobile App → API
- Third-party API → Platform API

Protocol:

- HTTPS

---

## Internal Communication

Examples:

- Platform API → Authentication Service
- Tenant Service → Notification Service
- Tenant Service → Storage Service

Protocol:

- HTTP/HTTPS over private networks

---

## Data Communication

Examples:

- Application → PostgreSQL
- Application → Redis
- Application → MinIO

Data services are never exposed directly to the public Internet.

---

# 6. Service Discovery

Services communicate using logical service names.

Examples:

```
auth-service
platform-api
tenant-api
postgres
redis
minio
```

Static IP addressing is prohibited.

---

# 7. Routing Model

Traefik is the primary ingress gateway.

Responsibilities include:

- Request routing
- HTTPS termination
- Middleware execution
- Load balancing
- Service discovery integration

No application service should expose a public listener directly.

---

# 8. Authentication Between Services

Internal service communication SHOULD use authenticated requests.

Approved mechanisms include:

- Service tokens
- Mutual trust via private networks
- Signed requests (where applicable)

Future Kubernetes deployments MAY adopt service identities and mutual TLS.

---

# 9. Authorization

Authentication identifies the calling service.

Authorization determines whether the requested action is permitted.

Every platform service SHALL validate authorization before performing privileged operations.

---

# 10. Communication Patterns

### Request–Response

Used for synchronous APIs.

Examples:

- Authentication
- CRUD operations
- Configuration retrieval

---

### Event-Driven (Future)

Suitable for:

- Notifications
- Audit events
- Workflow automation
- Background processing

Event-driven communication SHALL be introduced only where it provides clear operational value.

---

# 11. Fault Handling

Services SHALL implement:

- Connection timeouts
- Retry policies (where safe)
- Graceful error handling
- Health checks
- Circuit-breaking (future)

Communication failures SHOULD be observable through logs and metrics.

---

# 12. Observability

Service communication SHALL produce:

- Access logs
- Error logs
- Metrics
- Latency measurements
- Health status

Operational data SHALL integrate with:

- Prometheus
- Grafana
- Loki

---

# 13. Security

Communication security includes:

- TLS for external traffic.
- Private internal networks.
- Service authentication.
- Network segmentation.
- Audit logging.
- Least-privilege access.

Sensitive data MUST NOT be transmitted through unsecured channels.

---

# 14. Deployment Evolution

## Phase 1

- Docker Compose
- Docker DNS
- Traefik
- HTTP over private Docker networks

---

## Phase 2

- Multi-VPS
- Shared DNS
- Secure inter-node communication

---

## Phase 3 (Optional)

- Docker Swarm service networking

---

## Phase 4

- Kubernetes Services
- Kubernetes Ingress
- Network Policies
- Optional service mesh
- Optional mutual TLS

The logical communication model remains unchanged across deployment phases.

---

# 15. Architectural Constraints

The following constraints apply:

- No hardcoded service IP addresses.
- No direct public database access.
- No tenant-to-tenant communication.
- No bypassing the gateway for external requests.
- No unauthenticated platform service access.

---

# 16. Future Enhancements

Planned enhancements include:

- Distributed event bus
- Message queues
- Service identity management
- Mutual TLS
- Policy enforcement
- Service mesh adoption (if justified)

Technology choices SHALL be based on operational requirements rather than architectural trends.

---

# 17. Related Documents

- SYSTEM-OVERVIEW.md
- PLATFORM-ARCHITECTURE.md
- NETWORK-TOPOLOGY.md
- TENANT-ARCHITECTURE.md
- STORAGE-ARCHITECTURE.md

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

---

**Document Version:** 1.0

**Status:** Approved

**Owner:** SJ Cloud Platform Engineering

© SJ Cloud Platform Engineering. All Rights Reserved.