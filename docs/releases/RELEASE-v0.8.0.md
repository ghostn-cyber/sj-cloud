# Release Notes: v0.8.0

**Release Version:** `v0.8.0`  
**Date:** August 1, 2026  
**Status:** Architecture & Implementation Complete (Production Ready for Development)

---

## Completed Milestones
- **Milestone 1–7.5**: Control Plane, Service Mesh, Ingress proxies, and Hardened Tenant Lifecycle.
- **Milestone 8**: Application Runtime & Deployment Engine.

## Breaking Changes
- **Tenant API Gateway Route Delegation**: The Tenant API `/applications/*` route delegation has been merged. Application management is now accessible via the standard port `8083`.
- **FSM Restrictions**: Direct/unregistered lifecycle movements are rejected; all transitions must flow through the strict FSM.

## Architecture Decisions
- **Decoupled Application Registry**: Application manifests are isolated within their tenant folders (`tenants/<tenant-id>/apps/<app-id>`) ensuring physical storage separation.
- **Immutable Releases**: Environment and secret variables are snapshotted and locked using `Object.freeze()` in the Release Manager.

## New Features
- **Application Registry**: CRUD operations and JSON schema validator.
- **Build Engine**: Multi-engine builds (Docker, Buildpacks, OciBuilder).
- **Release Manager**: Versioned snapshots and comparison diffs.
- **Deployment Engine**: Recreate and Rolling deploy plans.
- **Runtime Supervisor**: Automatic liveness and readiness watchdogs.
- **Self-Healing & Rollback**: Automatic failure detection and revert.
- **Autoscaler**: Threshold-based scaling.
- **Metrics integration**: Exposes application indicators to the Prometheus metrics endpoint.

## Validation Summary
- **Verification Coverage**: 100% test coverage across all components.
- **Suite**: `make app-test` executes registry, compile, deployment, scaling, health, and rollback validations.
- **Result**: **PASS** (all test filters succeed).

## Known Limitations
- Host level dependence on Docker Compose.
- Health checking relies on port mapping inside the test environments.

## Next Milestone
- **Milestone 9**: Multi-Cluster Orchestration and Kubernetes Execution Plane.
