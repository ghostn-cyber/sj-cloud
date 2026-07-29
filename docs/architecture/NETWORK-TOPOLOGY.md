# Network Topology

**Document ID:** ARC-NETWORK-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Architecture

**Owner:** Platform Engineering

**Related Standards:**
- ISS-001
- STD-NETWORK-001
- STD-SECURITY-001

---

# 1. Purpose

This document defines the logical and physical network topology of the SJ Cloud Platform.

It describes how traffic flows through the platform, how services communicate, network segmentation, trust boundaries, and the evolution of the networking model from a single-server deployment to a Kubernetes-based infrastructure.

This document complements the Network Standard by illustrating how the standard is implemented within the platform architecture.

---

# 2. Networking Objectives

The SJ Cloud network architecture is designed to:

- Secure all inbound and outbound traffic.
- Isolate tenants and platform services.
- Minimize the public attack surface.
- Enable horizontal scalability.
- Support observability.
- Maintain portability across deployment phases.
- Prepare for Kubernetes networking.

---

# 3. High-Level Network Topology

```
                        Internet
                            │
                            ▼
                    Cloudflare Edge
              DNS • CDN • WAF • DDoS • TLS
                            │
                            ▼
                     Ubuntu VPS Firewall
                     (Allow 80, 443, SSH*)
                            │
                            ▼
                     Traefik Gateway
                            │
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
 Platform Services     Tenant Services      Management APIs
      │                     │                     │
      └──────────────┬──────┴──────────────┬──────┘
                     ▼                     ▼
              Internal Docker Networks
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 PostgreSQL       Redis         MinIO Storage
                     │
                     ▼
        Prometheus • Grafana • Loki
```

All public traffic MUST enter through Cloudflare before reaching the platform.

---

# 4. Trust Zones

The platform is divided into the following trust zones.

| Zone | Description | Public Access |
|------|-------------|---------------|
| Internet | External users and systems | Yes |
| Edge | Cloudflare services | Yes |
| Gateway | Traefik reverse proxy | Limited |
| Platform | Shared internal services | No |
| Tenant | Tenant applications | No |
| Data | PostgreSQL, Redis, MinIO | No |
| Operations | Monitoring and logging | No |

Traffic between trust zones SHALL be explicitly controlled.

---

# 5. Logical Network Segmentation

SJ Cloud defines the following logical networks.

```
edge-network
```

Purpose:

- Public ingress
- Reverse proxy

---

```
platform-network
```

Purpose:

- Shared platform services

---

```
tenant-network
```

Purpose:

- Tenant workloads

---

```
data-network
```

Purpose:

- PostgreSQL
- Redis
- MinIO

---

```
operations-network
```

Purpose:

- Monitoring
- Logging
- Metrics

---

```
management-network
```

Purpose:

- Administrative tooling
- Internal maintenance

Services SHALL only connect to the networks required for their operation.

---

# 6. Traffic Flow

### External Requests

```
Client
    │
Cloudflare
    │
Traefik
    │
Application
    │
Database
```

---

### Internal Requests

```
Application
      │
Platform API
      │
Redis
      │
PostgreSQL
```

Internal traffic remains on private networks.

---

# 7. Service Discovery

Services communicate using internal DNS names rather than IP addresses.

Examples:

```
postgres
redis
minio
auth-service
tenant-api
```

Hardcoded IP addresses are prohibited.

---

# 8. Firewall Model

Ubuntu hosts SHALL expose only the minimum required ports.

| Port | Purpose | Public |
|------|---------|--------|
| 80 | HTTP Redirect | Yes |
| 443 | HTTPS | Yes |
| 22 | SSH (Restricted) | Limited |
| 5432 | PostgreSQL | No |
| 6379 | Redis | No |
| 9000 | MinIO API | No |
| 9001 | MinIO Console | No |
| 3000 | Grafana | No |
| 9090 | Prometheus | No |
| 3100 | Loki | No |

Administrative ports MUST be restricted by firewall rules.

---

# 9. DNS Architecture

### Public DNS

Managed by Cloudflare.

Examples:

```
sjcloud.io
api.sjcloud.io
auth.sjcloud.io
storage.sjcloud.io
grafana.sjcloud.io
```

### Internal DNS

Managed by Docker networking (Phase 1–3) and Kubernetes DNS (Phase 4).

Examples:

```
postgres
redis
platform-api
tenant-api
```

---

# 10. Ingress Model

All inbound traffic SHALL follow:

```
Internet
     │
Cloudflare
     │
Traefik
     │
Service
```

No application container SHALL expose ports directly to the public Internet.

---

# 11. Egress Model

Outbound traffic MAY include:

- Email delivery
- External APIs
- Package repositories
- Object storage replication
- Monitoring integrations

Outbound traffic SHOULD be controlled and monitored.

---

# 12. Tenant Isolation

Tenant applications SHALL be isolated through:

- Separate runtime configuration.
- Dedicated application containers.
- Network segmentation.
- Access controls.
- Independent secrets.

Direct tenant-to-tenant communication is prohibited unless explicitly approved.

---

# 13. Data Access

Applications SHALL access:

- PostgreSQL
- Redis
- MinIO

through private networks only.

Direct Internet access to data services is prohibited.

---

# 14. Monitoring Network

Operational components communicate through a dedicated monitoring network.

Components include:

- Prometheus
- Grafana
- Loki

Monitoring traffic SHALL remain isolated from tenant traffic.

---

# 15. Deployment Evolution

### Phase 1

```
Single VPS
Docker Compose
Traefik
```

### Phase 2

```
Multiple VPS
Docker Compose
Shared DNS
```

### Phase 3 (Optional)

```
Docker Swarm
```

### Phase 4

```
Kubernetes Cluster
Ingress Controller
Network Policies
```

The logical network model SHALL remain consistent throughout all phases.

---

# 16. High Availability Considerations

Future high-availability improvements include:

- Multiple Traefik instances.
- Redundant PostgreSQL.
- Redis replication.
- Distributed object storage.
- Multi-node monitoring.
- Load-balanced application services.

These capabilities are introduced as infrastructure maturity increases.

---

# 17. Security Controls

Network security is enforced through:

- Cloudflare WAF.
- TLS encryption.
- Firewall policies.
- Private service networks.
- Service authentication.
- Least-privilege access.
- Centralized logging.

Implementation details are defined in `STD-SECURITY-001`.

---

# 18. Related Documents

- SYSTEM-OVERVIEW.md
- PLATFORM-ARCHITECTURE.md
- TENANT-ARCHITECTURE.md
- STORAGE-ARCHITECTURE.md
- SERVICE-MESH.md

---

# References

- ISS-001
- STD-NETWORK-001
- STD-SECURITY-001

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