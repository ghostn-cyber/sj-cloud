# Tenant Architecture

**Document ID:** ARC-TENANT-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Architecture

**Owner:** Platform Engineering

**Related Standards:**
- ISS-001
- STD-NETWORK-001
- STD-SECURITY-001
- STD-DEPLOYMENT-001

---

# 1. Purpose

This document defines the multi-tenant architecture of the SJ Cloud Platform.

It describes how tenants are provisioned, isolated, managed, monitored, and retired while sharing a common cloud infrastructure.

The architecture ensures that each tenant operates independently without compromising the security, performance, or reliability of other tenants.

---

# 2. Overview

A tenant represents an independent organization, business unit, government agency, NGO, product, or commercial customer hosted on the SJ Cloud Platform.

Examples include:

- Startup Jigawa
- CareCore
- Government Digital Services
- NGO Platforms
- Commercial SaaS Applications

Each tenant shares platform capabilities while maintaining logical isolation.

---

# 3. Multi-Tenant Principles

SJ Cloud adopts the following principles:

- Shared Infrastructure
- Logical Isolation
- Independent Deployment
- Independent Configuration
- Independent Scaling
- Least Privilege
- Secure by Default
- Standardized Operations

---

# 4. Tenant Lifecycle

Every tenant progresses through a defined lifecycle.

```
Requested
     │
Provisioning
     │
Active
     │
Maintenance
     │
Suspended
     │
Archived
     │
Deleted
```

## Lifecycle States

### Requested

A tenant request has been approved but no infrastructure exists.

---

### Provisioning

The platform creates:

- Tenant metadata
- Runtime configuration
- Secrets
- Storage
- Databases (if required)
- Network configuration

The tenant is not yet available to users.

---

### Active

The tenant is fully operational and available for normal use.

---

### Maintenance

The tenant remains deployed but is temporarily unavailable while updates or maintenance activities are performed.

---

### Suspended

The tenant is disabled due to administrative, contractual, security, or operational reasons.

Application data is preserved.

---

### Archived

The tenant is no longer active but retained for compliance, legal, or historical purposes.

---

### Deleted

All tenant resources have been securely removed according to the platform's data retention and deletion policies.

---

# 5. Tenant Components

Each tenant consists of the following logical components:

- Tenant Application
- Runtime Configuration
- Secrets
- Storage
- Database
- Logs
- Metrics
- Backups

These components are managed independently for each tenant.

---

# 6. Shared Platform Services

All tenants consume shared platform services rather than implementing them independently.

Shared services include:

- Authentication
- Authorization
- Certificate Management
- Notifications
- File Storage
- Logging
- Monitoring
- Metrics
- Platform API
- Deployment Services

This approach improves consistency and reduces operational overhead.

---

# 7. Tenant Isolation

Isolation is enforced across multiple layers.

## Application Isolation

Each tenant operates within dedicated application containers.

---

## Configuration Isolation

Environment variables and runtime settings are unique to each tenant.

---

## Secret Isolation

Secrets are provisioned independently and MUST NOT be shared between tenants.

---

## Database Isolation

Each tenant SHALL use:

- A dedicated database, or
- A dedicated schema, based on the platform deployment model.

The selected isolation strategy SHALL be documented and applied consistently.

---

## Storage Isolation

Object storage SHALL use tenant-specific buckets or prefixes with independent access policies.

---

## Network Isolation

Tenants communicate through approved platform interfaces.

Direct tenant-to-tenant communication is prohibited unless explicitly approved.

---

# 8. Tenant Provisioning

Provisioning SHALL be automated.

The provisioning process includes:

1. Register tenant metadata.
2. Allocate runtime resources.
3. Generate secrets.
4. Configure networking.
5. Create storage.
6. Initialize database.
7. Configure monitoring.
8. Configure logging.
9. Deploy application.
10. Verify health.

Manual provisioning SHOULD be avoided.

---

# 9. Tenant Identification

Every tenant SHALL have a unique identifier.

Example:

```
tenant_id: startup-jigawa

tenant_id: carecore

tenant_id: ministry-health

tenant_id: ngo-education
```

Tenant identifiers are immutable after creation.

---

# 10. Domain Model

Each tenant MAY use:

- A platform-managed subdomain.
- A custom domain.

Examples:

```
startupjigawa.sjcloud.io
carecore.sjcloud.io
health.sjcloud.io
```

Or:

```
startupjigawa.org
carecore.ng
example.gov.ng
```

DNS management SHALL integrate with the platform gateway.

---

# 11. Resource Allocation

Platform resources are allocated per tenant.

Examples include:

- CPU
- Memory
- Storage
- Database connections
- Redis usage
- Object storage quotas

Resource limits SHALL prevent a single tenant from degrading platform performance.

---

# 12. Monitoring

Each tenant SHALL have:

- Health monitoring
- Metrics collection
- Log aggregation
- Deployment history
- Resource usage reporting

Tenant metrics SHALL remain logically isolated.

---

# 13. Backup and Recovery

Backup policies SHALL apply independently to each tenant.

Supported operations include:

- Backup
- Restore
- Point-in-time recovery (where supported)
- Archive retrieval

Recovery operations SHOULD minimize disruption to other tenants.

---

# 14. Security Model

Security controls include:

- Role-based access control (RBAC)
- Tenant-scoped authorization
- Secret isolation
- TLS encryption
- Audit logging
- Network segmentation

Security policies SHALL be enforced consistently across all tenants.

---

# 15. Scaling Model

Each tenant SHALL scale independently.

Scaling MAY include:

- Additional application instances
- Increased compute resources
- Expanded storage
- Database optimization

Scaling one tenant MUST NOT require redeployment of other tenants.

---

# 16. Operational Responsibilities

Platform Engineering is responsible for:

- Shared infrastructure
- Platform services
- Monitoring
- Security
- Networking
- Deployment tooling

Tenant teams are responsible for:

- Application code
- Business logic
- Tenant-specific configuration
- Application data
- Functional testing

---

# 17. Future Enhancements

Planned capabilities include:

- Self-service tenant onboarding
- Automated billing integration
- Resource quota management
- Tenant usage analytics
- Marketplace provisioning
- Tenant lifecycle automation

These enhancements will build upon the lifecycle and isolation model defined in this document.

---

# 18. Related Documents

- SYSTEM-OVERVIEW.md
- PLATFORM-ARCHITECTURE.md
- NETWORK-TOPOLOGY.md
- STORAGE-ARCHITECTURE.md
- SERVICE-MESH.md

---

# References

- ISS-001
- STD-SECURITY-001
- STD-NETWORK-001
- STD-DEPLOYMENT-001

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