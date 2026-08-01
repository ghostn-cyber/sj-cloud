# Application Runtime Architecture

**Document ID:** ARC-APP-RUNTIME-001  
**Version:** 1.0  
**Status:** Approved  
**Classification:** Internal Architecture  

---

## 1. Introduction
The Application Runtime is the execution plane of the PaaS system in SJ Cloud. It manages the runtime context, dynamic configuration, and physical container orchestration for tenant applications.

## 2. Core Concepts
- **Application Manifest**: A structured definition (`application.json`) validating metadata, environment variables, routing configuration, scaling limits, and liveness/readiness health parameters.
- **Runtime Environment**: Decoupled container sandboxes isolated via Docker Compose networks.
- **Dynamic Ingress**: Dynamically generated routing rules automatically loaded by Traefik.

## 3. Directory Layout
Workload configurations are structured physically per tenant:
```text
tenants/
└── <tenant-id>/
    └── apps/
        └── <app-id>/
            ├── application.json    # Application Manifest
            └── releases/           # Immutable Release History
```

## 4. Security & Isolation
- **Network Boundaries**: Containers run within the isolated `sj-services` network. Inter-container networking is strictly controlled.
- **Environment Isolation**: Environment parameters are injected as static variables on container startup.
