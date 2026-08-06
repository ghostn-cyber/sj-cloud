# Capacity Planning operations

The capacity manager evaluates resource workloads (CPU, Memory, Disk, Containers) and outputs growth forecasting.

## Metrics
- `daysToLimit`: Days until the resource will hit limits based on historical and workload count growth.

## Queries
Get forecast:
```bash
curl http://localhost:8083/admin/capacity
```
 obituary
