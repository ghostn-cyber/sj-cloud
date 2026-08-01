# Architecture Decision Record: ARCH-017 — Docker API Compatibility Layer

## Status
Approved

## Context
The platform reverse proxy (Traefik v3.1.7) uses an internal Docker client SDK version that defaults to sending API requests with version `v1.24`.
However, the host machine's Docker daemon (v29.5.3) is configured to enforce a minimum Docker API version of `1.40`.
This mismatch triggers `HTTP 400 Bad Request` responses on every request, preventing Traefik's dynamic docker provider from discovering platform containers.
Since upgrading the base Traefik image is restricted due to sandbox environments (network timeouts) and modifying the host Docker daemon's configuration requires root sudo permissions which are unavailable in user space, we need an intermediate compatibility solution.

## Decision
We will deploy an independent sidecar translation proxy service (`docker-api-proxy`) written in native Node.js.
The proxy service will:
1. Mount the host's `/var/run/docker.sock` socket read-only.
2. Intercept Unix socket connections from Traefik.
3. Automatically translate all request path segments and headers referencing API version `v1.24` to `v1.40` in real-time.
4. Expose the translated connection to Traefik via a private socket `/etc/traefik/docker-proxy.sock`.

This enforces zero-trust socket isolation, as Traefik no longer has access to the raw host Docker socket.

## Alternatives Considered
- **Upgrading Traefik to v3.6.0+**: Blocked by network timeouts in the local development sandbox.
- **Lowering Host daemon minimum API version**: Blocked by lack of sudo privileges on the host machine.
- **DOCKER_API_VERSION Env Override**: Ineffective during Traefik's initial connection handshakes.

## Consequences
- **Positive**: Restores full dynamic service routing in Traefik without requiring privileged host changes. Enforces container security by isolating the raw socket behind a translation layer.
- **Negative**: Adds a light container runtime dependency (`docker-api-proxy`) to the ingress layer.

## Removal Strategy
This compatibility layer will be removed once the host Docker Engine supports native client negotiation (or is upgraded), or when the platform moves to a Kubernetes environment where edge routing does not query local Docker sockets.
To roll back, remove the proxy service from `10-traefik.yml` and point Traefik directly to the host's read-only Docker socket.
