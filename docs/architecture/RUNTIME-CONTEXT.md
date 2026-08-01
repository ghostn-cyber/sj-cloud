# Runtime Context Propagation Specification

This document details the structure, purpose, and lifecycle of the `RuntimeContext` object passed through the Service Mesh during requests.

## Request Pipeline Flow

For every request intercepted by the service mesh, a single `RuntimeContext` is instantiated at the entry point and propagated across all policy engines:

```
Request Intercept 
       ↓
Extract HTTP Headers (traceparent, tenant-id, correlation-id)
       ↓
Instantiate RuntimeContext
       ↓
Evaluate Routing Engine
       ↓
Evaluate Retry & Circuit Breaker Policies
       ↓
Execute Downstream HTTP Request (Propagated Headers)
```

## Structure of RuntimeContext

A `RuntimeContext` encapsulates five core blocks:

1. **Tenant Context:**
   - Tracks `tenantId`, `domain`, and custom metadata.

2. **Service Context:**
   - Tracks unique request-specific IDs: `requestId` and `correlationId`.
   - Tracks request source and destination IDs.

3. **Policies:**
   - Holds static configs for routing, timeouts, retries, circuit breakers, and security.

4. **Tracing Context:**
   - Tracks OpenTelemetry W3C trace identifiers: `traceId` (32 hex characters), `spanId` (16 hex characters), and `parentSpanId` (16 hex characters).

5. **Observability Context:**
   - Tracks runtime statistics for the request: `startTime`, `attempts`, `failures`, and flags for timeouts or circuit breaker trips.

## Header Propagation Rules

All outgoing proxy calls must inject the context parameters as HTTP headers to ensure end-to-end tracing and correlation:

- `x-request-id`: Unique identifier of the current execution leg.
- `x-correlation-id`: Preserved across all nested service call hops.
- `x-tenant-id`: Active tenant resolving database connections downstream.
- `x-source-service`: Identity of the service initiating the call.
- `x-destination-service`: Identity of the service being called.
- `traceparent`: W3C trace header format: `00-{traceId}-{spanId}-01`.
