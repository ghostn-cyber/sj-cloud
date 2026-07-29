# Storage Architecture

**Document ID:** ARC-STORAGE-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Architecture

**Owner:** Platform Engineering

**Related Standards:**
- ISS-001
- STD-SECURITY-001
- STD-NETWORK-001
- STD-DEPLOYMENT-001

---

# 1. Purpose

This document defines the storage architecture of the SJ Cloud Platform.

It describes how structured data, cached data, object storage, backups, and persistent platform data are managed while supporting a secure, scalable, and multi-tenant environment.

---

# 2. Objectives

The storage architecture is designed to:

- Provide reliable persistent storage.
- Support multi-tenant isolation.
- Ensure data durability.
- Simplify backup and recovery.
- Support horizontal platform growth.
- Enable future cloud-native storage migration.

---

# 3. Storage Principles

The platform follows these principles:

- Persistent by Design
- Data Isolation
- Encryption Where Appropriate
- Automated Backup
- Immutable Backups
- Scalability
- High Availability (Future)
- Least Privilege

---

# 4. Storage Layers

SJ Cloud organizes storage into four logical layers.

```
Application Layer
        │
        ▼
Storage Services
        │
 ┌──────┼───────────┐
 ▼      ▼           ▼
PostgreSQL   Redis   MinIO
        │
        ▼
 Backup & Recovery
```

Each storage technology has a dedicated responsibility.

---

# 5. PostgreSQL

## Purpose

PostgreSQL is the primary relational database.

Responsibilities include:

- Tenant data
- Platform metadata
- Authentication data
- Configuration
- Operational records
- Business transactions

---

## Design Principles

PostgreSQL SHALL:

- Store structured data.
- Support transactional integrity.
- Enforce relational constraints.
- Maintain auditability.

---

## Tenant Isolation

Supported isolation models:

- Dedicated database per tenant.
- Dedicated schema per tenant.

The selected model SHALL remain consistent within a deployment.

---

# 6. Redis

Redis provides high-speed, in-memory data services.

Typical workloads include:

- Cache
- Session storage
- Rate limiting
- Queue metadata
- Temporary data
- Distributed locks

Redis is not a system of record.

Applications MUST NOT rely on Redis for permanent storage.

---

# 7. MinIO

MinIO provides S3-compatible object storage.

Supported objects include:

- Documents
- Images
- Videos
- Audio
- Backups
- Reports
- User uploads
- Static assets

Objects SHALL be referenced by metadata stored in PostgreSQL where applicable.

---

# 8. Storage Responsibilities

| Storage | Primary Purpose |
|----------|-----------------|
| PostgreSQL | Structured relational data |
| Redis | Temporary in-memory data |
| MinIO | Binary object storage |

Each storage system SHALL be used only for its intended purpose.

---

# 9. Tenant Data Model

Each tenant owns its data.

Tenant resources include:

- Databases or schemas
- Object storage
- Cache namespace
- Backup sets
- Logs
- Metrics

Tenant data SHALL remain logically isolated.

---

# 10. Object Storage Organization

Object storage SHOULD follow a predictable hierarchy.

Example:

```
tenant-id/
    documents/
    media/
    exports/
    backups/
    reports/
```

This structure simplifies lifecycle management and access control.

---

# 11. Backup Architecture

The platform SHALL support backups for:

- PostgreSQL
- MinIO
- Configuration
- Secrets (where applicable)
- Infrastructure definitions

Redis SHOULD not normally be backed up unless operational requirements justify it.

---

# 12. Recovery Strategy

Recovery SHALL support:

- Full restore
- Partial restore
- Point-in-time recovery (where supported)
- Tenant-specific restore
- Disaster recovery

Recovery procedures are documented in the operational runbooks.

---

# 13. Storage Security

Storage security includes:

- Authentication
- Authorization
- TLS encryption
- Network isolation
- Audit logging
- Backup encryption
- Least-privilege access

Public access to storage services is prohibited unless explicitly approved.

---

# 14. Data Lifecycle

Platform data progresses through the following lifecycle.

```
Created
     │
Active
     │
Modified
     │
Archived
     │
Deleted
```

Retention policies SHALL comply with organizational and regulatory requirements.

---

# 15. Monitoring

Storage services SHALL expose operational metrics.

Examples include:

- Capacity
- Disk utilization
- Read/write latency
- Connection count
- Cache hit ratio
- Object count
- Backup status

Metrics SHALL integrate with Prometheus.

---

# 16. Scalability

Future storage scalability MAY include:

### PostgreSQL

- Read replicas
- Streaming replication
- Partitioning

### Redis

- Replication
- Sentinel
- Cluster mode

### MinIO

- Distributed object storage
- Erasure coding
- Multi-node deployments

The logical storage model remains unchanged as capacity grows.

---

# 17. Disaster Recovery

Storage disaster recovery includes:

- Scheduled backups
- Restore validation
- Replication (future)
- Off-site backup storage
- Recovery testing

Recovery objectives SHALL be defined by operational policy.

---

# 18. Related Documents

- SYSTEM-OVERVIEW.md
- PLATFORM-ARCHITECTURE.md
- NETWORK-TOPOLOGY.md
- TENANT-ARCHITECTURE.md
- SERVICE-MESH.md

---

# References

- ISS-001
- STD-SECURITY-001
- STD-NETWORK-001
- RUN-BACKUP-001 (future)
- RUN-RESTORE-001 (future)

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