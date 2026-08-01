# Network Naming Architecture

**Document ID:** ARC-NAMING-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Architecture

**Owner:** Platform Engineering

**Related Standards:**
- ISS-001
- STD-NETWORK-001
- STD-SECURITY-001
- STD-NAMING-001

---

# 1. Purpose

This document defines the naming standards for all network-related resources within the SJ Cloud Platform. 

It establishes clear conventions for Docker networks, container hostnames, storage volumes, env variables, and DNS entries. Consistent naming ensures automation scripts, monitoring dashboards, and deployment pipelines can reliably identify and communicate with resources.

---

# 2. Naming Objectives

The naming standards are designed to enforce:
- **Predictable Discovery:** Service discovery paths can be inferred directly from the service name.
- **Unified Identifiers:** Parity between Docker container names and hostnames.
- **Logical Grouping:** Clear separation of shared platform services from tenant-specific workloads.
- **Portability:** Namespace structures map directly onto Kubernetes Service and Deployment names.

---

# 3. Resource Naming Conventions

All platform resources must adhere to the prefix and casing rules defined below.

### 3.1 Case Conventions
- **Docker Networks / Containers / Volumes / Hostnames:** Must use `kebab-case`.
- **Environment Variables:** Must use `UPPER_SNAKE_CASE`.
- **DNS / Host Domains:** Must use lower-case characters separated by dots (e.g., `auth.startupjigawa.com`).

---

# 4. Docker Network Standards

Platform Docker networks use the prefix `sj-` followed by the function of the network segment.

| Network Name | Purpose / Boundary | Scope | Example |
| :--- | :--- | :--- | :--- |
| **`sj-edge`** | Web Ingress routing | Shared | `sj-edge` |
| **`sj-proxy`** | Internal routing proxy zone | Shared | `sj-proxy` |
| **`sj-services`** | Application and API executions | Shared & Tenants | `sj-services` |
| **`sj-data`** | Isolated databases and caches | Shared & Tenants | `sj-data` |
| **`sj-monitoring`** | Observability scraping | Shared | `sj-monitoring` |
| **`sj-backup`**| Isolated backup pipelines | Shared | `sj-backup` |

---

# 5. Container & Hostname Standards

Containers and their internal DNS hostnames MUST use matching names to prevent resolution confusion.

### 5.1 Shared Platform Containers
- Pattern: `sj-<service-name>`
- Examples:
  - `sj-auth` (Authentication Service)
  - `sj-api-gateway` (Platform Ingress Gateway)
  - `sj-notification` (Notification Service)
  - `sj-postgres` (Relational Database)
  - `sj-redis` (Session Cache)
  - `sj-minio` (Object Storage)
  - `sj-prometheus` (Observability Agent)

### 5.2 Tenant-Specific Containers
- Pattern: `sj-tenant-<tenant-slug>-<service-type>`
- Examples:
  - `sj-tenant-carecore-app` (CareCore Frontend/API Container)
  - `sj-tenant-carecore-worker` (CareCore Queue Worker)
  - `sj-tenant-startupjigawa-app` (Startup Jigawa Application)

---

# 6. Docker Volume Standards

Docker persistent volumes must declare their owner and the target data store type.

- Pattern: `sj-<owner>-<engine>-data`
- Examples:
  - `sj-platform-postgres-data` (Shared database storage)
  - `sj-platform-minio-data` (Shared object storage data)
  - `sj-platform-redis-data` (Central cache database dump)
  - `sj-tenant-carecore-uploads` (User uploads for CareCore)

---

# 7. Environment Variable Standards

Environment variables related to networking must carry descriptive prefixes denoting their scope.

### 7.1 Networking Configuration Variables
- `DB_HOST`: Hostname of the target database (e.g., `sj-postgres`).
- `REDIS_HOST`: Hostname of the target Redis cache (e.g., `sj-redis`).
- `MINIO_ENDPOINT`: Internal endpoint for object storage (e.g., `http://sj-minio:9000`).
- `AUTH_SERVICE_URL`: DNS endpoint for the authentication service (e.g., `http://sj-auth`).

### 7.2 Tenant Scope Headers
All tenant headers injected by the API Gateway must carry the prefix `X-Tenant-`:
- `X-Tenant-ID`
- `X-Tenant-DB-Schema`
- `X-Tenant-Storage-Bucket`

---

# 8. Kubernetes Naming Compatibility

The Docker naming patterns defined in this document map directly onto Kubernetes resource names.

- **Docker network `sj-services`** maps to Kubernetes namespace `sj-services`.
- **Container `sj-auth`** maps to Kubernetes deployment `auth-service` and its corresponding service endpoint `auth` inside namespace `sj-services` (resolvable via `http://auth.sj-services`).
- **Volume `sj-platform-postgres-data`** maps to a Kubernetes PersistentVolumeClaim (PVC) named `postgres-data-pvc` inside the `sj-data` namespace.

---

# Revision History

| Version | Date | Description | Author |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-07-30 | Initial architecture release | Platform Engineering |

---

**Owner:** Platform Engineering  
**Approved by:** Platform Architecture Board  
© SJ Cloud Platform Engineering. All Rights Reserved.
