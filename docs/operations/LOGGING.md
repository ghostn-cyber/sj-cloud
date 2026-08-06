# Platform Logging operations

The logging subsystem outputs structured JSON lines to the filesystem under `storage/logs/`.

## Log Format
Every log message conforms to:
```json
{
  "timestamp": "2026-08-01T15:00:00.000Z",
  "level": "INFO",
  "scope": "service",
  "message": "Operational status normal",
  "node": "hostname",
  "pid": 1234
}
```

## Search Criteria
Filter logs using query parameters:
```bash
curl "http://localhost:8083/admin/logs?level=ERROR&scope=service"
```
