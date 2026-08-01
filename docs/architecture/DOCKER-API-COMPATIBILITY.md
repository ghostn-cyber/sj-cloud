# Docker API Compatibility Investigation

**Document ID:** ARCH-DOC-002  
**Status:** Approved  
**Last Updated:** 2026-07-30  
**Owner:** Platform Engineering Group  

---

## 1. Purpose

This document details the technical investigation regarding the Docker API version compatibility mismatch between the edge reverse proxy (Traefik v3.1.7) and the host Docker Engine daemon (v29.5.3). It outlines the root cause, alternative paths evaluated, and the chosen architecture translation layer.

## 2. Problem Statement

When Traefik attempts to connect directly to the host's Docker socket `/var/run/docker.sock`, it repeatedly logs:
```
Failed to retrieve information of the docker client and server host: client version 1.24 is too old
```
This error prevents Traefik's `docker.Provider` from initializing, which blocks dynamic service discovery and edge routing.

## 3. Root Cause Analysis

The compatibility issue stems from two mismatched assumptions in the software components:
1. **Docker Engine v29+ Default Policy**: In Docker Engine 29.x, the daemon enforces a minimum supported API version (set to `1.40` or `1.44` depending on the build). Requests using an API version versioned lower than this threshold (e.g. `v1.24`) are rejected with `HTTP 400 Bad Request`.
2. **Traefik SDK Hardcoding**: Traefik's Docker provider is compiled using an older Docker Go SDK client version that hardcodes client handshakes to `1.24` and does not automatically perform negotiation upon initial socket handshake. Because Traefik's static configuration does not expose a configuration key to override the API version request headers (and ignores the `DOCKER_API_VERSION` environment variable during initial connectivity check), Traefik always requests `1.24`.

## 4. Alternatives Considered & Investigation Results

### Alternative A: Upgrading Traefik to v3.6.0+
- **Description**: Upgrade the Traefik container to a version that implements automatic client API negotiation.
- **Feasibility**: High in production. However, in our local sandbox, registry connections suffer TLS timeouts, preventing arbitrary image pulls. Upgrading base infrastructure images is also outside the scope of minor configuration changes.

### Alternative B: Lowering Host Docker Daemon Minimum API Version
- **Description**: Configure the host daemon to accept `1.24` requests by setting `min-api-version: "1.24"` in `/etc/docker/daemon.json` or `DOCKER_MIN_API_VERSION=1.24` in `docker.service` environment.
- **Feasibility**: Requires root system privileges to edit `/etc/docker/daemon.json` and restart the system-wide Docker service. This is blocked in the non-privileged development environment.

### Alternative C: Utilizing `DOCKER_API_VERSION` Environment Variable
- **Description**: Set `DOCKER_API_VERSION=1.40` in the Traefik container environment.
- **Feasibility**: Tested. Traefik's initial connection routine ignores this variable during startup health checks, continuing to request `1.24` endpoints.

### Alternative D: Docker Socket API Translation Proxy
- **Description**: Build a lightweight translation layer sidecar that intercepts API calls on a private socket, translating the `/v1.24/` URL prefixes to `/v1.40/` before forwarding requests to the host daemon.
- **Feasibility**: High. The proxy runs in user space without requiring root privileges, keeps Traefik on the stable `v3.1.7` image, and enforces zero-trust socket access (the raw socket is unexposed to Traefik).

---

## 5. Compatibility Matrix

| Component | Version | Supported Docker API Versions | Compatibility Status |
| :--- | :--- | :--- | :--- |
| **Traefik Ingress** | v3.1.7 | `1.24` (Client Default) | ❌ Incompatible (Legacy handshake) |
| **Host Docker Engine** | v29.5.3 | `1.40` to `1.47` (Min: `1.40`) | ❌ Incompatible (Rejects < `1.40`) |
| **Translation Proxy** | v1.0.0 | Intercepts `1.24` ⇄ Translates to `1.40` |  Compatible |

---

## 6. Future Removal Strategy

The API Translation Proxy is a temporary workaround to enable local development and standalone single-VPS deployments.

### Removal Criteria
The compatibility proxy can be removed when either of the following conditions is met:
1. The host Docker Engine is updated/reconfigured to support standard negotiation, or administrative permission is obtained to configure `min-api-version: 1.24` on the host daemon.
2. The platform is migrated to Kubernetes, where Traefik routes ingress resources natively and no longer queries a local Docker socket.
3. Traefik is upgraded to a version where client API negotiation is natively supported and active.

### Migration/Rollback Strategy
To remove the proxy and restore direct socket connections:
1. Update `infrastructure/compose/10-traefik.yml` to remove the `docker-socket-proxy` service definition.
2. Re-attach the host socket `/var/run/docker.sock` to the Traefik container as read-only.
3. Revert Traefik's provider endpoint in `infrastructure/traefik/traefik.yml` back to `unix:///var/run/docker.sock`.
