# Service Policy Specification

This document defines the policy governance and runtime specifications for all internal platform services.

## Policy Groups

Every service configuration YAML must declare and structure its operational policies into the following groups:

### 1. Routing
Determines the internal DNS path and endpoint location mappings:
- `internal_dns`: The internal URL mapping (e.g. `http://auth`).
- `container_name`: The runtime container name (e.g. `sj-auth`).
- `endpoints`: Custom host arrays for load balancing override.

### 2. Timeouts
Enforces connection limits to prevent socket starvation:
- `connect_ms`: Socket connection establishment limit (default: 1500ms).
- `read_ms`: Incoming buffer read timeout (default: 5000ms).
- `write_ms`: Output buffer write timeout (default: 5000ms).
- `request_ms`: Absolute request execution timeout (default: 8000ms).

### 3. Retries
Defines how failures are retried for idempotent operations:
- `type`: `immediate`, `linear`, `exponential`, `exponential_jitter`.
- `max_attempts`: Retry count budget (default: 3).
- `base_delay_ms`: Initial delay interval (default: 100ms).
- `max_delay_ms`: Ceiling limit for delay backoff (default: 2000ms).

### 4. Circuit Breakers
Protects downstream backends from request cascading failures:
- `failure_threshold`: Consecutive request failures triggering TRIP to Open (default: 5).
- `recovery_timeout_ms`: Open cooldown interval before trying Half-Open probe (default: 10000ms).
- `half_open_max_requests`: Successful requests required to close the circuit (default: 2).

### 5. Load Balancing
Determines the instance routing selection algorithm:
- `strategy`: `round_robin`, `least_connections`, `weighted`, `health_based`.

### 6. Security
Specifies access limitations:
- `tls_required`: Boolean state enforcing TLS connections.
- `allowed_sources`: Whitelist of service IDs allowed to call this service.

### 7. Telemetry
Standardizes monitoring hook locations:
- `/health`: Liveness checks.
- `/ready`: Readiness checks.
- `/metrics`: Prometheus metric scrape targets.
