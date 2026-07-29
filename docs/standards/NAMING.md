# Naming Standard

**Document ID:** STD-NAMING-001

**Version:** 1.0

**Status:** Approved

**Classification:** Internal Standard

**Owner:** Platform Engineering

---

# 1. Purpose

This standard defines the official naming conventions for all engineering assets within the SJ Cloud Platform.

Consistent naming improves:

- Readability
- Automation
- Searchability
- Maintainability
- Operational consistency
- Infrastructure portability

All repositories, services, infrastructure resources, documentation, and platform components MUST follow this standard unless an approved Architecture Decision Record (ADR) explicitly permits an exception.

---

# 2. Naming Principles

Names MUST be:

- Predictable
- Human-readable
- Descriptive
- Consistent
- Stable
- Automation-friendly

Names MUST NOT:

- Contain spaces
- Contain special characters
- Depend on abbreviations that are not documented
- Include version numbers
- Include temporary identifiers
- Include personal names

---

# 3. Case Conventions

| Style | Usage | Example |
|---------|--------|----------|
| kebab-case | Infrastructure resources | startup-jigawa |
| snake_case | Databases | startup_jigawa |
| PascalCase | PHP Classes | UserController |
| camelCase | Variables & Methods | getTenant() |
| UPPER_SNAKE_CASE | Environment Variables | APP_ENV |

---

# 4. Repository Naming

Repositories MUST use:

```
kebab-case
```

Examples:

```
sj-cloud-platform

startup-jigawa

carecore

packages-auth

packages-notification

platform-cli

platform-sdk

platform-docs
```

Repository names MUST describe a single responsibility.

---

# 5. Docker Container Naming

Pattern

```
tenant-service-environment
```

Examples

```
startup-jigawa-api-dev

startup-jigawa-web-prod

carecore-worker-prod

platform-auth-prod
```

---

# 6. Docker Network Naming

Pattern

```
tenant-network
```

Examples

```
startup-jigawa-network

carecore-network

shared-platform-network
```

---

# 7. Docker Volume Naming

Pattern

```
tenant-service-data
```

Examples

```
carecore-postgres-data

startup-jigawa-storage

platform-minio-data

platform-redis-data
```

---

# 8. Database Naming

Databases MUST use

```
snake_case
```

Examples

```
startup_jigawa

carecore

platform_auth

tenant_registry

audit_logs
```

---

# 9. Table Naming

Tables MUST:

- be plural
- use snake_case

Examples

```
users

tenant_accounts

audit_logs

service_tokens

deployment_events
```

---

# 10. Column Naming

Examples

```
created_at

updated_at

deleted_at

tenant_id

service_name

last_login_at
```

Boolean fields

```
is_active

is_verified

is_deleted

has_access
```

---

# 11. API Naming

REST endpoints

```
/api/v1/users

/api/v1/tenants

/api/v1/projects

/api/v1/deployments
```

Resources MUST use plural nouns.

---

# 12. Domain Naming

Production

```
platform.sjcloud.io

api.sjcloud.io

auth.sjcloud.io

storage.sjcloud.io

monitoring.sjcloud.io
```

Tenant Examples

```
startupjigawa.sjcloud.io

carecore.sjcloud.io
```

Environment prefixes

```
dev.api.sjcloud.io

staging.api.sjcloud.io
```

---

# 13. Environment Variables

Format

```
UPPER_SNAKE_CASE
```

Examples

```
APP_NAME

APP_ENV

APP_KEY

DB_HOST

DB_PORT

DB_DATABASE

DB_USERNAME

DB_PASSWORD

REDIS_HOST

REDIS_PORT
```

Prefixes

```
PLATFORM_

TENANT_

SERVICE_
```

Example

```
PLATFORM_REGION

TENANT_ID

SERVICE_TIMEOUT
```

---

# 14. Secret Naming

Examples

```
POSTGRES_PASSWORD

MINIO_SECRET_KEY

JWT_PRIVATE_KEY

JWT_PUBLIC_KEY

REDIS_PASSWORD
```

Secret names MUST describe their purpose.

---

# 15. Git Branch Naming

Patterns

```
feature/

fix/

docs/

security/

refactor/

ci/

release/

hotfix/
```

Examples

```
feature/platform-monitoring

fix/postgres-backup

security/tls-hardening

docs/network-standard

release/v1.2.0
```

---

# 16. Git Tag Naming

Release tags

```
v1.0.0

v2.3.1

v3.0.0-beta.1
```

Semantic Versioning is mandatory.

---

# 17. GitHub Workflow Naming

Examples

```
ci.yml

security.yml

release.yml

lint.yml

docs.yml

docker.yml
```

Workflow names should reflect a single responsibility.

---

# 18. Documentation Naming

Documentation MUST use

```
UPPERCASE-WITH-HYPHENS.md
```

Examples

```
SYSTEM-OVERVIEW.md

NETWORK-STANDARD.md

DISASTER-RECOVERY.md

FIRST-DEPLOYMENT.md
```

---

# 19. Infrastructure Naming

Examples

```
platform-auth

platform-api

platform-storage

platform-monitoring

platform-registry
```

Shared infrastructure MUST begin with

```
platform-
```

---

# 20. Kubernetes Resource Naming (Future)

Resources MUST use

```
kebab-case
```

Examples

```
platform-api

tenant-manager

storage-service

auth-service
```

Namespaces

```
platform

shared

startup-jigawa

carecore
```

---

# 21. Logging

Service names

```
platform-api

platform-auth

tenant-api

tenant-worker
```

Log identifiers MUST remain stable throughout the service lifecycle.

---

# 22. Reserved Prefixes

| Prefix | Purpose |
|----------|---------|
| platform- | Shared platform services |
| tenant- | Tenant services |
| packages- | Shared libraries |
| docs- | Documentation repositories |
| infra- | Infrastructure tooling |
| sdk- | Software Development Kits |

Reserved prefixes MUST NOT be repurposed.

---

# 23. Prohibited Naming

The following are prohibited:

```
temp

test123

new

copy

backup

final

latest

misc

unknown
```

Names MUST clearly communicate intent.

---

# 24. Compliance

Naming compliance SHALL be verified during:

- Code review
- Repository creation
- Infrastructure review
- Documentation review

Automated validation SHOULD be implemented where practical.

---

# References

- ISS-001
- SECURITY-STANDARD.md
- NETWORK-STANDARD.md
- DEPLOYMENT-STANDARD.md

---

**Document Version:** 1.0

**Status:** Approved

**Owner:** SJ Cloud Platform Engineering

© SJ Cloud. All Rights Reserved.