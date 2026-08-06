# Dashboard Data API operations

The dashboard API serves as a unified JSON statistics provider for the admin SRE UI.

## Endpoint
Retrieve complete stats:
```bash
curl http://localhost:8083/admin/dashboard
```

## JSON Payload Structure
```json
{
  "timestamp": "2026-08-01T15:00:00.000Z",
  "summary": {
    "tenantsCount": 2,
    "appsCount": 4,
    "pipelineRuns": 8,
    "alertsCount": 0
  },
  "health": {
    "status": "HEALTHY",
    "score": 100
  },
  "metrics": {
    "cpu": { "value": 15, "unit": "%" }
  }
}
```
 obituary
