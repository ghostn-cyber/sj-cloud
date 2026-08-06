# ARCH-022: Developer Platform & CI/CD Engine

## Status
Approved

## Context
With the implementation of the Application Runtime and Tenant Lifecycle subsystems, SJ Cloud needs a full-featured CI/CD Control Plane to enable developers to orchestrate builds, tests, scans, and deployments automatically. We must enforce immutable artifact delivery, repeatable builds, strict policy validation (denying backdoor direct deployments), webhook-based automations, and multi-environment promotions.

## Decision
We introduce the following architectural components to implement the Developer Platform and CI/CD Engine:

1. **Repository Manager**:
   - Manages and validates repository configurations via JSON schemas.
   - Provides credentials management (encrypted via AES-256-GCM) and OAuth flows.
   - Coordinates repository cloning and synchronization via Local/GitHub/GitLab providers.

2. **Pipeline Engine**:
   - Executes build, test, and scan pipelines using templates for laravel, node, express, react, nextjs, fastapi, golang, rust, etc.
   - Managed by an 11-stage FSM Finit State Machine (`QUEUED`, `RUNNING`, `SUCCESS`, `FAILED`, `CANCELLED`).
   - Restores/saves dependency caches and logs stdout/stderr for auditability.

3. **Artifact Registry**:
   - Stores compiled binaries, ZIP, and OCI image manifests inside tenant directory structures.
   - Computes immutable SHA-256 checksums and SBOM metadata.

4. **Secrets Manager**:
   - Secures API keys, deployment credentials, and certificates.
   - Scopes secrets at global, org, tenant, application, environment, and pipeline levels.

5. **Environment & Promotion Manager**:
   - Manages environments (Dev, Test, Stage, Prod), environment freezes, and deployment windows.
   - Handles manual approval gates for staging-to-production promotions.

6. **Webhook Automation**:
   - Listens to Git push/PR hooks, validates HMAC-SHA256 signatures, and protects against replay attacks.

7. **Runtime Governance**:
   - Prohibits direct invocation of build and deployment engines by API clients, ensuring all deployments go through the pipeline engine.

## Consequences
- **Repeatability**: Build caches and template stages ensure pipeline runs are reproducible.
- **Traceability**: Audit events are generated for every pipeline start, promotion, and secret rotation.
- **Security**: Backdoor deployments are prevented, and secrets are encrypted with AES-256-GCM.
