# ARCH-021: Application Runtime & Deployment Engine

## Status
Approved

## Context
Following the hardening of the Tenant Lifecycle engine, the SJ Cloud platform requires a comprehensive PaaS execution plane to enable tenants to build, deploy, manage, and scale applications. We must establish an application registry, build pipelines (Docker/Buildpacks/OCI), immutable releases, deployment engines supporting Rolling/Recreate strategies governed by a 6-State FSM, health supervision, autoscaling, and rollback capabilities.

## Decision
We introduce the following architectural components to implement the Application Runtime layer:

1. **Application Registry**:
   - Manages and validates application definitions against JSON schemas.
   - Saves applications to disk inside tenant directories (`tenants/<tenant-id>/apps/<app-id>/application.json`).
   - Watches configuration files to reload in-memory cache and publishes events.

2. **Multi-Engine Build Engine**:
   - Supports Docker, Buildpacks, and OciBuilder engines to compile source code into OCI-compliant images.
   - Integrates image security vulnerability scanners.

3. **Immutable Release Management**:
   - Formulates releases containing image digests, environment snapshots, secrets snapshots, and deployment configs.
   - Calculates immutable sha256 checksums of the release object.

4. **FSM-Governed Deployment Engine**:
   - Supports Recreate (stop-then-start) and Rolling (start-verify-stop) strategies.
   - Governed by a 6-State Finite State Machine (`CREATED`, `BUILDING`, `BUILT`, `DEPLOYING`, `VERIFYING`, `ACTIVE`, `FAILED`, `ROLLBACK`).

5. **Self-Healing & Supervision**:
   - Actively checks container processes via liveness and readiness probes.
   - Restarts crashed processes automatically via a watchdog supervisor.

6. **Prometheus Metrics & Observability**:
   - Exposes application-level metrics (`sj_application_build_total`, `sj_application_deployment_total`, etc.) via the standard API gateway.

## Consequences
- **Security**: Prevents unauthorized modifications by snapshotting variables and secrets inside immutable releases.
- **Resilience**: Automates rollback and self-healing to reduce application downtime to zero.
