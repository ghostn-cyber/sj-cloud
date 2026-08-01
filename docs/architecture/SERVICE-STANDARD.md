# SJ Cloud Service Standard

**Document ID:** SVC-001

**Status:** Approved

**Version:** 1.0

---

# 1. Purpose

This document defines the engineering standard for every service deployed within SJ Cloud.

A "service" includes:

- Platform Services
- Shared Services
- Infrastructure Services
- Tenant Services

Every service must implement the same operational contract.

---

# 2. Required Repository Structure

Each service shall follow:

service/

README.md

Dockerfile

docker-compose.yml (optional)

src/

tests/

config/

health/

scripts/

---

# 3. Docker Standard

Every service must provide

Dockerfile

Healthcheck

Non-root execution

Minimal base image

Graceful shutdown

Version labels

OCI image labels

---

# 4. Required Endpoints

Every HTTP service must expose

GET /health

Returns service health.

GET /ready

Returns readiness state.

GET /version

Returns

Service name

Version

Build

Commit

Optional

GET /metrics

Prometheus metrics.

---

# 5. Logging Standard

Logs shall be

JSON

UTC

Structured

Include

timestamp

level

service

request_id

correlation_id

message

No console-formatted logs in production.

---

# 6. Configuration Standard

Configuration shall originate from

Environment variables

Secrets

Mounted configuration

Never

Source code

Hardcoded values

---

# 7. Environment Variables

Every service should support

SERVICE_NAME

SERVICE_VERSION

LOG_LEVEL

PORT

HOST

ENVIRONMENT

---

# 8. Health Checks

Health checks must verify

Dependencies

Database

Cache

Filesystem

External APIs (when required)

Health endpoints must respond quickly.

---

# 9. Metrics

Metrics should expose

Request count

Latency

Errors

Memory

CPU

Database connections

Queue depth

---

# 10. Security

Every service shall

Run as non-root

Drop unnecessary capabilities

Use least privilege

Validate input

Use TLS where applicable

Never expose secrets

---

# 11. Networking

Services communicate using

Docker DNS

Examples

http://auth

http://redis

http://postgres

Never use

Container IPs

Public DNS

---

# 12. Dependencies

Dependencies must be explicitly documented.

Example

Depends on

PostgreSQL

Redis

Storage

Notifications

---

# 13. Error Handling

Errors must

Be structured

Never expose stack traces

Return appropriate HTTP status codes

Include correlation IDs

---

# 14. Graceful Shutdown

Services must correctly handle

SIGTERM

SIGINT

Shutdown timeout

Connection draining

Cleanup

---

# 15. Resource Limits

Every service shall define

CPU limits

Memory limits

Restart policy

Healthcheck interval

---

# 16. Testing Requirements

Every service must include

Unit tests

Integration tests

Health tests

Architecture compliance

Performance validation

---

# 17. Documentation Requirements

Every service README must contain

Purpose

Architecture

Configuration

Deployment

Health endpoints

Metrics

Dependencies

Ports

Troubleshooting

Security considerations

---

# 18. Versioning

Services shall use Semantic Versioning.

Example

v1.0.0

v1.2.1

v2.0.0

Container images should use immutable version tags.

---

# 19. Service Lifecycle

Every service progresses through

Development

↓

Testing

↓

Staging

↓

Production

↓

Maintenance

↓

Retirement

Retired services must include a migration strategy.

---

# 20. Service Checklist

Before a service is accepted into SJ Cloud

☐ README completed

☐ Dockerfile reviewed

☐ Health endpoint implemented

☐ Ready endpoint implemented

☐ Version endpoint implemented

☐ Metrics endpoint implemented

☐ Structured logging enabled

☐ Environment variables documented

☐ Resource limits configured

☐ Security review completed

☐ Tests passing

☐ Performance baseline recorded

☐ Architecture review approved

---

# 21. Related Documents

- PLATFORM-COMPLIANCE.md
- PLATFORM-ARCHITECTURE.md
- SYSTEM-OVERVIEW.md
- NETWORK-TOPOLOGY.md
- NETWORK-SECURITY.md
- DEPLOYMENT-STANDARD.md
- SECURITY-STANDARD.md