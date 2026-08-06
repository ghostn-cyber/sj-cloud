# Platform Monitoring operations

The platform monitoring subsystem collects and exposes key telemetry metrics in Prometheus line protocol format.

## Exposed Metrics
- `sj_application_runs_total`
- `sj_application_failures_total`
- `sj_pipeline_runs_total`
- `sj_pipeline_runs_success`
- `sj_pipeline_runs_failed`
- `sj_capacity_cpu_utilization`
- `sj_capacity_memory_utilization`
- `sj_capacity_disk_utilization`
- `sj_backups_verified_total`
- `sj_alerts_triggered_total`
- `sj_incidents_active`
- `sj_platform_health_score`

## Configuration
Endpoints are accessed at `/metrics` over the default administrative port `8083`.
To inspect raw outputs:
```bash
curl http://localhost:8083/metrics
```
