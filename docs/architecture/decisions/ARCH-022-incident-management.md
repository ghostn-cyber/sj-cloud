# ARCH-022 — Incident Management

## Status
Approved

## Context
Platform anomalies, performance spikes, or service outages must be detected quickly, raised to operator attention, and transitioned through a strict lifecycle state machine to guarantee resolution.

## Decision
- Implement FSM-governed incident state engine: OPEN, ACKNOWLEDGED, INVESTIGATING, MITIGATED, RESOLVED, CLOSED.
- Auto-escalate CRITICAL severity alerts from the Alert Engine to open incidents.
- Log all state transition events on the Event Bus.

## Consequences
- Guarantees auditable and trackable resolution paths for outages.
- Reduces time-to-resolution through automated escalation workflows.
