# Incident Management operations

All CRITICAL severity alerts automatically open an active incident.

## Incident FSM Lifecycle
The incident transitions through the following states:
`OPEN` -> `ACKNOWLEDGED` -> `INVESTIGATING` -> `MITIGATED` -> `RESOLVED` -> `CLOSED`.

## Transitioning Incidents
Transition an incident state:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"state": "ACKNOWLEDGED", "reason": "Engineer on call investigating"}' \
  http://localhost:8083/admin/incidents/<incident-id>
```
