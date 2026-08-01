# Service Identity and Authentication Specification

This document details the naming conventions and identity assertions used to establish trust and access control across the internal Service Mesh.

## Identity Naming Standard

Every service is assigned a unique cryptographic and logical identity derived from its registration parameters:

1. **Service ID (Logical Name):** 
   - A lowercase alphanumeric string matching `^[a-z0-9-]+$`.
   - Used for internal DNS resolution and API routing headers (e.g. `auth`, `tenant-manager`).

2. **SPIFFE/SPIRE Format (Future Readiness):**
   - Service names map to SPIFFE identity URIs:
     `spiffe://sj-cloud.local/ns/{namespace}/sa/{service_id}-service-account`
   - Example: `spiffe://sj-cloud.local/ns/sj-services/sa/auth-service-account`

## Verification and Enforcement

1. **Source Assertion:**
   - In the local Docker Compose runtime, identity is asserted by the `x-source-service` header injected by the edge proxy or the calling proxy.
   - Whitelists declared in `security.allowed_sources` are validated by the receiving proxy before routing requests downstream.

2. **Zero Trust Network Policy:**
   - Communication between services is blocked by default at the network interface layer.
   - Any service communicating outside its declared allowed sources will receive a `403 Forbidden` response.
