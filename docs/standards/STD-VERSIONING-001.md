# Versioning Standard

**Document ID:** STD-VERSIONING-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Standard

**Owner:** Platform Engineering

**Related Standard:** ISS-001

---

# 1. Purpose

This standard defines the official versioning strategy for all software, infrastructure, APIs, documentation, container images, database schemas, and engineering artifacts within the SJ Cloud Platform.

The objectives are to:

- Standardize release management.
- Improve deployment predictability.
- Ensure compatibility.
- Simplify rollback.
- Enable automated CI/CD.
- Maintain traceability across repositories.

Unless explicitly approved through an Architecture Decision Record (ADR), all versioned assets MUST comply with this standard.

---

# 2. Scope

This standard applies to:

- Platform services
- Tenant applications
- APIs
- Shared libraries
- SDKs
- Docker images
- Infrastructure configurations
- Git repositories
- Documentation
- ADRs
- RFCs
- Database migrations
- Release artifacts

---

# 3. Versioning Principles

All versioned assets SHALL be:

- Predictable
- Immutable
- Traceable
- Reproducible
- Backward-compatible where practical
- Machine-readable

---

# 4. Semantic Versioning

SJ Cloud adopts Semantic Versioning (SemVer).

```
MAJOR.MINOR.PATCH
```

Example:

```
1.0.0
2.3.5
5.1.0
```

---

# 5. Version Components

## MAJOR

Increment when:

- Breaking API changes
- Breaking database changes
- Breaking infrastructure changes
- Removal of supported features

Example:

```
2.0.0
```

---

## MINOR

Increment when:

- New functionality
- Backward-compatible features
- New services
- New APIs

Example:

```
1.4.0
```

---

## PATCH

Increment when:

- Bug fixes
- Documentation corrections
- Security patches
- Performance improvements
- Internal refactoring

Example:

```
1.4.3
```

---

# 6. Pre-release Versions

Allowed identifiers:

```
-alpha

-beta

-rc
```

Examples:

```
2.0.0-alpha.1

2.0.0-beta.2

2.0.0-rc.1
```

Production releases MUST NOT include pre-release suffixes.

---

# 7. Git Tags

Release tags MUST follow:

```
vMAJOR.MINOR.PATCH
```

Examples:

```
v1.0.0

v1.1.0

v2.5.4
```

Pre-release tags:

```
v2.0.0-beta.1

v3.0.0-rc.2
```

---

# 8. Release Branches

Release branches SHALL use:

```
release/v1.2

release/v2.0
```

Hotfix branches:

```
hotfix/v1.2.1
```

---

# 9. Docker Image Tags

Container images MUST be tagged using:

```
application:version
```

Examples:

```
platform-api:1.0.0

auth-service:2.1.0

carecore-web:4.0.2
```

Avoid mutable tags such as:

```
latest
new
current
```

The `latest` tag MAY exist for developer convenience but MUST NOT be used in production deployments.

---

# 10. API Versioning

REST APIs SHALL use URI versioning.

Example:

```
/api/v1/users

/api/v1/auth

/api/v2/tenants
```

Breaking changes require a new major API version.

---

# 11. Database Migrations

Database migrations MUST:

- Be sequential
- Be version controlled
- Be repeatable

Example:

```
2026_07_29_000001_create_users_table.php

2026_07_29_000002_create_tenants_table.php
```

Migration history MUST NOT be rewritten after release.

---

# 12. Documentation Versioning

Engineering documentation SHALL include:

- Document Version
- Status
- Last Updated
- Revision History

Example:

```
Document Version: 1.2

Status: Approved

Last Updated: 2026-08-15
```

---

# 13. ADR Versioning

Architecture Decision Records SHALL use immutable numbering.

Example:

```
ADR-0001

ADR-0002

ADR-0003
```

ADR identifiers MUST NEVER be reused.

---

# 14. RFC Versioning

RFC identifiers SHALL be immutable.

Examples:

```
RFC-0001

RFC-0002
```

Withdrawn RFCs retain their identifiers.

---

# 15. Infrastructure Versioning

Infrastructure changes SHALL be version controlled through Git.

Infrastructure releases SHOULD align with platform release versions where practical.

---

# 16. Dependency Versioning

Dependencies SHOULD use explicit version constraints.

Avoid:

```
*
latest
master
main
```

Prefer:

```
^11.0

~3.2

1.8.5
```

---

# 17. Release Lifecycle

Every release SHALL follow:

```
Development
      │
Feature Complete
      │
Testing
      │
Release Candidate
      │
Approval
      │
Production Release
      │
Maintenance
      │
End of Support
```

---

# 18. Supported Versions

The Platform Engineering Team SHALL define supported release windows.

Example:

| Release | Support |
|----------|---------|
| Current Major | Full Support |
| Previous Major | Security Updates |
| Older Releases | Unsupported |

---

# 19. Deprecation Policy

Deprecated functionality MUST:

- Be documented
- Include migration guidance
- Define a removal timeline
- Be announced before removal

---

# 20. Rollback Compatibility

Production releases SHOULD support rollback to the previous stable release.

Schema changes that prevent rollback require explicit approval and documented recovery procedures.

---

# 21. Compliance

Versioning compliance SHALL be verified during:

- Release review
- CI/CD validation
- Code review
- Documentation review

---

# 22. Exceptions

Exceptions require:

- Approved ADR
- Business justification
- Risk assessment
- Platform Engineering approval

---

# References

- ISS-001
- STD-NAMING-001
- STD-DEPLOYMENT-001
- ADR-0001
- RFC-0001

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-07-29 | Initial release |

---

**Document Version:** 1.0

**Status:** Approved

**Owner:** Platform Engineering

© SJ Cloud Platform Engineering. All Rights Reserved.