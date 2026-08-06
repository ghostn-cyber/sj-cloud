# Operational Health Scoring

SJ Cloud calculates health scores between `0` (Critical Outage) and `100` (Perfect Health).

## Scoring Matrix
Scores are impacted by:
- Active Critical Incidents: -30 points
- Warnings / Alert triggers: -5 points
- Pipeline worker starvation: -10 points
- Resource threshold violations: -15 points

## Endpoints
Query platform health scores:
```bash
curl http://localhost:8083/admin/health-score
```
 obituary
