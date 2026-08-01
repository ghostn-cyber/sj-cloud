# Service Lifecycle Governance

This document defines the phases, transitions, and verification checks governing a service's lifecycle in the platform registry.

## Lifecycle Phases

```
Design / Config Definition (YAML)
               ↓
Static Validation (CLI Schema Check)
               ↓
Snapshot Compilation (Control Plane Compiler)
               ↓
Deployment & Runtime Registration
               ↓
Active Routing (In-Memory Cache)
               ↓
Deprecation & Decommissioning
```

## Description of Phases

### 1. Definition
Developers define service boundaries, dependencies, and policies in a YAML configuration inside `config/services/{service_id}.yaml`.

### 2. Validation
Before deployment, a validation script runs `registry-validator` against the schema. Any formatting, invalid values, or schema violations fail the build.

### 3. Compilation
Valid configurations are compiled into the static JSON snapshot. This ensures that:
- Structural integrity is verified.
- Mismatched IDs between filenames and service definitions are blocked.
- Configuration syntax is parsed only once.

### 4. Registration & Routing
At runtime, the Mesh Proxy loads the snapshot. On start and hot-reload, the proxy updates its routing table.

### 5. Deprecation
To retire a service, it is marked with a deprecation state or its allowed callers are restricted to zero. Once traffic declines to zero, the YAML config is removed from `config/services/`, which triggers compilation of a new snapshot and removes it from the routing cache.
