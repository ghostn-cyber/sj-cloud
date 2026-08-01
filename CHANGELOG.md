# Changelog

All notable changes to the **SJ Cloud** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.0] - 2026-08-01

### Added (Milestone 8)
- **Application Registry**: CRUD configuration endpoints and schema validators for tenant applications.
- **Build Engine**: Added OCI compilers supporting Docker and Buildpack engines, as well as image vulnerability scanning.
- **Release Manager**: Immutable release snapshotting matching configuration states, environment parameters, and secrets.
- **Deployment strategies**: Implemented Recreate and Rolling (Start-Verify-Stop) update strategies governed by a 6-State FSM.
- **Supervision & watchdogs**: Dynamic Traefik mapping and background liveness/readiness health check loops.
- **Rollback Engine**: Trigger automated/manual rollbacks restoring the latest known healthy release on deployment failure.
- **Autoscaling**: Threshold-based resource metric scaling evaluator framework.

## [0.7.5] - 2026-07-31

### Added (Milestone 7 & 7.5)
- **Tenant Lifecycle Engine**: Immutable, template-driven workflow manager executing provisioning/decommissioning.
- **Hardened FSM**: Tenant lifecycle state transitions with automatic route configuration reload.
- **Secret generation**: Automated provisioning of private keys, PostgreSQL databases, and Redis clusters per tenant.

## [0.6.5] - 2026-07-30

### Added (Milestone 4 - 6.5)
- **Service Mesh**: Service Registry, DNS lookup, and EventBus notification integration.
- **Observability**: Prometheus metrics exporting endpoints (`/metrics`) and custom health monitoring targets.

## [0.3.0] - 2026-07-29

### Added (Milestone 1 - 3)
- **Ingress Layer**: Traefik v3 reverse proxy and dynamic TLS management.
- **Socket Isolation**: Standalone Docker API Translation Proxy preventing direct socket access.
- **Network Segmentation**: 6-Network logical separation boundaries (`sj-edge`, `sj-proxy`, `sj-services`, `sj-data`, `sj-monitoring`, `sj-backup`).
