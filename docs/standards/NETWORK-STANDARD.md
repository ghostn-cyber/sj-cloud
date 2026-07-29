# Network Standard

**Document ID:** STD-NETWORK-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Standard

**Owner:** Platform Engineering

**Related Standard:** ISS-001

---

# 1. Purpose

This standard defines the mandatory networking requirements for the SJ Cloud Platform.

It establishes a consistent, secure, and scalable networking model that supports multi-tenant deployments, shared platform services, and future migration from Docker Compose to Kubernetes.

All infrastructure MUST comply with this standard unless an approved Architecture Decision Record (ADR) authorizes an exception.

---

# 2. Objectives

The networking architecture SHALL:

- Provide secure communication.
- Minimize attack surface.
- Support tenant isolation.
- Enable horizontal scaling.
- Maintain portability.
- Support high availability.
- Simplify operations.
- Prepare for Kubernetes adoption.

---

# 3. Network Principles

Every network SHALL follow these principles:

- Private by Default
- Explicit Exposure
- Least Privilege
- Defense in Depth
- Segmentation
- Zero Trust
- High Observability
- Platform Independence

---

# 4. Network Architecture

The standard network topology is:

```
                Internet
                    │
            Cloudflare Edge
                    │
                    ▼
             Traefik Proxy
                    │
        ┌───────────┴────────────┐
        │                        │
 Platform Services         Tenant Services
        │                        │
        └───────────┬────────────┘
                    │
             Internal Networks
                    │
        ┌───────────┼────────────┐
        ▼           ▼            ▼
   PostgreSQL     Redis       MinIO
```

All inbound traffic MUST terminate at Traefik.

---

# 5. Network Segmentation

The platform SHALL use logical network segmentation.

Required network categories:

- Edge Network
- Shared Platform Network
- Tenant Network
- Storage Network
- Monitoring Network
- Management Network

Services MUST only join the networks required for their operation.

---

# 6. Public Exposure

Public exposure MUST be minimized.

The following components MAY expose public endpoints:

- Traefik
- Public APIs
- Public Web Applications

The following MUST NOT be publicly accessible:

- PostgreSQL
- Redis
- MinIO Console
- Internal APIs
- Monitoring Interfaces
- Administrative Services

---

# 7. Ingress

All external requests SHALL pass through:

```
Internet
      │
Cloudflare
      │
Traefik
      │
Service
```

Direct container publishing SHOULD be avoided.

---

# 8. Internal Service Communication

Internal communication SHALL:

- Use private Docker networks.
- Avoid public routing.
- Use service discovery.
- Minimize unnecessary network hops.

Services SHOULD communicate using internal DNS names.

Example:

```
postgres

redis

auth-service

storage-service
```

---

# 9. DNS Standards

Internal DNS names MUST use:

```
service-name
```

Examples:

```
postgres

redis

platform-auth

tenant-api
```

Public DNS MUST follow:

```
service.domain
```

Examples:

```
api.sjcloud.io

auth.sjcloud.io

storage.sjcloud.io
```

---

# 10. Port Management

Default service ports SHALL be standardized.

| Service | Port |
|----------|------|
| HTTP | 80 |
| HTTPS | 443 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| Grafana | 3000 |
| Prometheus | 9090 |
| Loki | 3100 |
| Mailpit Web | 8025 |
| Mailpit SMTP | 1025 |

Alternative ports require documentation.

---

# 11. Service Discovery

Services MUST communicate using service names rather than IP addresses.

Example:

```
DB_HOST=postgres

REDIS_HOST=redis
```

IP addresses MUST NOT be hardcoded.

---

# 12. Reverse Proxy

Traefik SHALL provide:

- HTTPS termination
- Routing
- Middleware
- Load balancing
- Automatic service discovery
- Certificate management

All public HTTP traffic SHALL be redirected to HTTPS.

---

# 13. Cloudflare Integration

Cloudflare SHALL provide:

- DNS
- CDN
- DDoS protection
- WAF
- TLS edge termination
- Rate limiting (where applicable)

Cloudflare becomes the primary Internet edge.

---

# 14. Tenant Isolation

Each tenant SHALL be logically isolated.

Isolation SHALL include:

- Networks
- Secrets
- Databases
- Storage
- Runtime configuration

Tenants MUST NOT communicate directly unless explicitly approved.

---

# 15. East-West Traffic

Service-to-service communication SHALL:

- Remain private.
- Use internal DNS.
- Avoid unnecessary exposure.
- Be observable.

Future Kubernetes deployments SHOULD support Network Policies.

---

# 16. IPv4 / IPv6

Current standard:

- IPv4 Required

Future support:

- Dual Stack (IPv4 + IPv6)

Platform services SHOULD avoid assumptions that prevent IPv6 adoption.

---

# 17. TLS Requirements

External traffic MUST use TLS.

Requirements:

- TLS 1.2 minimum
- TLS 1.3 preferred
- Strong cipher suites
- Automatic renewal
- Secure certificate storage

---

# 18. Firewall

Ubuntu hosts MUST use a host firewall.

Only required ports SHALL be opened.

Example:

- 80
- 443
- 22 (restricted)

Database ports SHOULD NOT be publicly exposed.

---

# 19. Monitoring

Networking SHALL expose metrics including:

- Bandwidth
- Request rate
- Error rate
- Latency
- Active connections
- TLS status

Metrics SHALL integrate with Prometheus.

---

# 20. Logging

Network events SHOULD be logged.

Examples:

- Reverse proxy access
- TLS failures
- Routing errors
- Blocked requests
- Firewall events

Logs SHALL be centralized.

---

# 21. Load Balancing

Current:

Traefik

Future:

Traefik + Kubernetes Services

Future load balancing SHALL preserve compatibility with current deployments.

---

# 22. Disaster Recovery

Networking documentation SHALL include:

- DNS recovery
- Certificate recovery
- Reverse proxy restoration
- Network recreation
- Firewall restoration

Procedures are defined in the runbooks.

---

# 23. Compliance

Networking SHALL be reviewed during:

- Infrastructure Review
- Security Review
- Architecture Review
- Deployment Review

---

# 24. Exceptions

Network exceptions require:

- Architecture review
- Security review
- Approved ADR
- Documented justification
- Defined review period

---

# References

- ISS-001
- STD-SECURITY-001
- STD-NAMING-001
- STD-DEPLOYMENT-001
- ARC-NETWORK-001 (future)
- RUN-DISASTER-RECOVERY-001 (future)

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | 2026-07-29 | Initial release |

---

**Document Version:** 1.0

**Status:** Approved

**Owner:** SJ Cloud Platform Engineering

© SJ Cloud. All Rights Reserved.