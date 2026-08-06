# Alerting operations

The Alert Engine constantly evaluates system levels against configured thresholds.

## Default Alert Rules
- `high-cpu`: CPU > 80% (WARNING)
- `high-memory`: Memory > 85% (WARNING)
- `high-disk`: Disk > 90% (CRITICAL)
- `restart-loops`: Container restarts > 5 (CRITICAL)
- `tenant-unhealthy`: Tenant health unhealthy (CRITICAL)
- `app-unhealthy`: App health unhealthy (CRITICAL)

## Endpoints
List rules and triggered alert history:
```bash
curl http://localhost:8083/admin/alerts
```
