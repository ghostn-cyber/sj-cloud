# SJ Cloud SRE Runbooks

This guide details operational runbooks to handle platform issues.

## 1. High CPU / Memory Alerts
- **Symptoms**: Alert `high-cpu` or `high-memory` triggered.
- **Resolution**:
  1. Inspect active processes via `/admin/profiler`.
  2. Identify the offending tenant or app using `/admin/diagnostics`.
  3. Scale up replicas or limit resource constraints.

## 2. Container Restart Loops
- **Symptoms**: Alert `restart-loops` triggered.
- **Resolution**:
  1. Retrieve application logs using `/admin/logs?scope=application&appId=<app-id>`.
  2. Inspect crash logs. Correct configuration errors or deploy a fix release.

## 3. Incident State Management
- **Workflow**:
  1. Once alerted, change status to `ACKNOWLEDGED`.
  2. Set to `INVESTIGATING` while troubleshooting.
  3. Set to `MITIGATED` once workaround is active.
  4. Set to `RESOLVED` and `CLOSED` when final fix is verified.
