# Service Metadata Specification

This document details the registry tagging, versioning, and environment properties assigned to services in the SJ Cloud platform.

## Metadata Fields

Each service YAML definition must contain a primary `service` block declaring its lifecycle tags:

1. **`id`:**
   - Unique identifier of the service matching its file basename.

2. **`name`:**
   - Human-readable name of the component for logging, tracing, and dashboards.

3. **`version`:**
   - Semantic Versioning format (`MAJOR.MINOR.PATCH`).
   - Declares the active deployment api boundary.

4. **`protocol`:**
   - Defines the transport format: `http`, `https`, `grpc`, or `tcp`.

5. **`visibility`:**
   - `public`: Exposed directly to edge routers (Traefik).
   - `private`: Access restricted to internal network calls from `api-gateway` or specified sources.
   - `internal`: Internal platform utility.

6. **`network`:**
   - Docker container bridge name (`sj-services` or `sj-proxy`).

7. **`owner`:**
   - Team owner identification for platform accountability.

8. **`environment`:**
   - Active execution tier: `development`, `staging`, or `production`.
