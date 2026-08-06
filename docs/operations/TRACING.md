# Distributed Tracing operations

SJ Cloud utilizes the standard W3C Trace Context specifications for distributed request tracing.

## Trace Headers
- `traceparent`: `00-${traceId}-${spanId}-${traceFlags}`

## Queries
Fetch all completed traces:
```bash
curl http://localhost:8083/admin/traces
```

Query a specific trace graph:
```bash
curl "http://localhost:8083/admin/traces?traceId=4bf92f3577b34da6a3ce929d0e0e4736"
```
