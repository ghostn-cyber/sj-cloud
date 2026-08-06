# Platform Infrastructure & Topology Architecture

This document describes the design principles, networking topology, security controls, and resource limits governing the SJ Cloud platform infrastructure.

## Stacks Taxonomy
The local development environment is modularized into 8 versionless Docker Compose stacks:

1. **`00-core.yml` (Ingress & Proxy)**
   - Traefik ingress gateway (`sj-traefik`)
   - Secure Docker Socket API proxy translator (`sj-docker-socket-proxy`)
2. **`10-platform.yml` (Control Plane)**
   - Service registry REST API (`sj-registry-api`)
3. **`20-mesh.yml` (Service Mesh)**
   - Mesh runtime reverse proxy (`sj-mesh-proxy`)
4. **`30-storage.yml` (Stateful Services)**
   - PostgreSQL 16 database instance (`sj-postgres`)
   - Redis 7 cache and key-value store (`sj-redis`)
   - MinIO Object storage (`sj-minio` & `sj-minio-bootstrap` provisioner)
5. **`40-monitoring.yml` (Metrics Stack)**
   - Prometheus time-series collector (`sj-prometheus`)
   - Grafana visualization panel (`sj-grafana`)
   - Alertmanager webhook system (`sj-alertmanager`)
   - Exporters (Node Exporter, cAdvisor, Blackbox Exporter)
6. **`50-observability.yml` (Logging & Traces)**
   - Loki log aggregator (`sj-loki`)
   - Promtail daemon logging collector (`sj-promtail`)
   - OpenTelemetry Trace collector (`sj-otel-collector`)
   - Jaeger APM trace board (`sj-jaeger`)
7. **`60-development.yml` (Mock Platform Services)**
   - Mock backend endpoints (Auth, Storage, billing, tenant lifecycle, etc.)
8. **`70-tools.yml` (Developer Utilities)**
   - pgAdmin, Redis Insight, Mailpit, Adminer.

---

## Networking Isolation Boundaries
Security policies are enforced using strict, isolated network partitions:

- **`sj-edge` (Public Ingress)**: Exposed to the host network (ports `80`/`443`). Only contains Traefik.
- **`sj-proxy` (Private Routing)**: Connects Traefik to the mesh proxies and dashboard endpoints.
- **`sj-services` (Control/Mesh Plane)**: Internal communication between microservices and registry.
- **`sj-data` (State Boundary)**: Restricts database access to internal microservices and storage nodes.
- **`sj-monitoring` (Telemetry Plane)**: Scrapes metrics and traces silently from other networks.
- **`sj-backup` (Disaster Recovery)**: Private channel connecting pg_dump and MinIO.

No database or internal dashboard service is exposed to the host machine directly. Access must pass through the Traefik Ingress Gateway (`sj-cloud.test`).

---

## Resource Management & Limits
To prevent local system degradation, every container has hard limits defined:

- **Core Ingress**: 0.5 CPU, 256MB RAM.
- **Storage Services**: 0.8 CPU, 512MB RAM (PostgreSQL), 0.5 CPU, 256MB RAM (Redis).
- **Monitoring/Observability**: 0.5 CPU, 256MB RAM (Grafana/Prometheus/Jaeger/Loki).
- **Microservices & Mocks**: 0.2 CPU, 128MB RAM max.

---

## Health Check and Watchdog Architecture
All containers implement native health checks:
- PostgreSQL: `pg_isready` check.
- Redis: `redis-cli ping` assertion.
- MinIO: API `/minio/health/live` HTTP status check.
- Traefik: CLI native `--ping` flag check.
- Socket Proxy: Custom health check client over socket connection.
- Microservices: HTTP `/health` query verification.
