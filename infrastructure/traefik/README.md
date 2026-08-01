# Traefik Reverse Proxy Configuration

This directory contains the static and dynamic configuration files for the Traefik Reverse Proxy, serving as the core ingress controller for SJ Cloud.

## Directory Structure

- `traefik.yml`: The static configuration file, containing entrypoints, providers, metrics, logging, and health check settings.
- `dynamic/`: Directory containing dynamic configuration files loaded at runtime without restarting Traefik.
  - `middlewares/`: Reusable middleware layers for security headers, rate limiting, and compression.
  - `routers/`: Router definitions for internal and external platform routing.
  - `services/`: Custom service targets (such as the internal api/dashboard services).
  - `tls/`: Configurations for TLS versions, options, and certificate stores.
  - `providers/`: File provider settings.
- `certificates/`: Folder containing local developer and Cloudflare origin TLS certificates.

## Key Features

1. **Dual EntryPoints:** Handles HTTP (port 80) and HTTPS (port 443). Automatically redirects all HTTP requests to HTTPS secure endpoints.
2. **Prometheus Integration:** Exposes metrics on `http://<traefik-ip>:80/metrics`.
3. **Structured JSON Logging:** Emits application and access logs in standard JSON format for Loki log aggregation.
4. **Basic Auth Dashboard:** Protects the internal admin dashboard via basic auth credentials.
