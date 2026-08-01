# docker-api-proxy

A standalone, zero-dependency, non-root Node.js Unix socket translation proxy.

## Purpose
Enables compatibility between Traefik's internal Docker Go SDK client (which requests version `v1.24` API endpoints) and modern Docker Engine daemons (which require `v1.40+` API headers).

## Architecture
- Intercepts Unix socket connections at `/etc/traefik/docker-proxy.sock`.
- Translates HTTP protocol URIs and request headers from version `v1.24` to `v1.40` in real-time.
- Forwards the stream transparently to `/var/run/docker.sock`.
- Employs structured JSON logging.
- Handles graceful shutdown and connection drains.

## Deployment
Orchestrated as a sidecar container in `infrastructure/compose/10-traefik.yml`.

## Testing
Run unit tests locally:
```bash
npm test
```
