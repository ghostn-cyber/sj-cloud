# SJ Cloud Platform Compliance Standard

**Document ID:** PCS-001

**Status:** Approved

**Version:** 1.0

**Applies To:**

- Platform Services
- Shared Services
- Tenant Applications
- Infrastructure Components

---

# 1. Purpose

This document defines the minimum engineering, security, operational, and architectural requirements that every component deployed into SJ Cloud must satisfy.

Compliance with this document is mandatory.

No component may be promoted to staging or production until all applicable requirements have been met.

---

# 2. Compliance Principles

Every platform component shall be:

- Secure by default
- Observable by default
- Automated by default
- Stateless where possible
- Environment configurable
- Recoverable
- Testable
- Documented

---

# 3. Networking Compliance

## 3.1 Public Exposure

Only Traefik may expose ports to the host.

Allowed:

✓ 80

✓ 443

No other service may publish ports.

---

## 3.2 Network Membership

Services shall only join the networks required for operation.

Example

Traefik

sj-edge

sj-proxy

PostgreSQL

sj-data

API Gateway

sj-proxy

sj-services

---

## 3.3 Internal Communication

Services must communicate using Docker DNS.

Allowed

http://auth

http://postgres

http://redis

Forbidden

IP addresses

localhost

Public URLs

---

# 4. Security Compliance

Every service must satisfy:

✓ Non-root user

✓ no-new-privileges

✓ Read-only filesystem where practical

✓ Least privilege

✓ Secrets outside source code

✓ No hardcoded credentials

✓ Environment-driven configuration

---

# 5. Container Compliance

Every container shall include:

- restart policy
- healthcheck
- image version
- labels
- resource limits
- graceful shutdown
- signal handling

Containers must not rely on restart loops for normal operation.

---

# 6. Health & Readiness

Every HTTP service shall expose

GET /health

GET /ready

GET /version

Optional

GET /metrics

Health endpoints must never require authentication.

---

# 7. Observability

Every service shall provide

Structured JSON logs

UTC timestamps

Request ID

Correlation ID

Log level

Metrics endpoint

No plain-text production logs.

---

# 8. Configuration

Configuration must be supplied through

Environment variables

Configuration files

Secrets

Never

Hardcoded values

Environment-specific logic inside source code

---

# 9. Storage

Persistent services must declare

Volumes

Backup strategy

Restore strategy

Recovery testing

Ephemeral services shall not persist runtime state.

---

# 10. Security Headers

Public HTTP services must provide

HSTS

Content Security Policy

X-Frame-Options

X-Content-Type-Options

Referrer Policy

Rate limiting

HTTPS redirect

---

# 11. Documentation

Every service must include

README.md

Architecture

Deployment

Configuration

Health endpoints

Dependencies

Ports

Environment variables

Troubleshooting

---

# 12. Testing

Every service must pass

Static validation

Unit tests

Integration tests

Health verification

Architecture compliance

Security compliance

Performance baseline

---

# 13. CI/CD Requirements

A service cannot be merged unless

✓ lint passes

✓ validate passes

✓ test passes

✓ benchmark passes

✓ documentation updated

---

# 14. Monitoring

Every production service must export

Health

Ready

Metrics

Logs

Version

---

# 15. Naming Standards

Services shall follow

sj-<service>

Examples

sj-auth

sj-api-gateway

sj-storage

sj-search

Networks

sj-edge

sj-services

sj-data

Volumes

sj-postgres-data

sj-minio-data

Containers

sj-auth

sj-postgres

sj-redis

---

# 16. Production Checklist

Before production deployment verify

☐ Documentation complete

☐ Health endpoints available

☐ Metrics available

☐ Security headers verified

☐ Configuration externalized

☐ Tests passing

☐ Backup configured

☐ Monitoring enabled

☐ Resource limits defined

☐ Network isolation verified

☐ No privileged container

---

# 17. Compliance Enforcement

Compliance is enforced through

- Architecture Reviews
- CI/CD Validation
- Platform Tests
- Security Audits
- Operational Reviews

Non-compliant services shall not be deployed.

---

# 18. Related Documents

- SYSTEM-OVERVIEW.md
- PLATFORM-ARCHITECTURE.md
- NETWORK-SECURITY.md
- NETWORK-TOPOLOGY.md
- DEPLOYMENT-STANDARD.md
- SECURITY-STANDARD.md
- SERVICE-STANDARD.md