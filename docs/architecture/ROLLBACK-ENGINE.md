# Rollback Engine Architecture

**Document ID:** ARC-ROLLBACK-001  
**Version:** 1.0  
**Status:** Approved  
**Classification:** Internal Architecture  

---

## 1. Introduction
The Rollback Engine protects platform applications against failed deployments by automatically reverting to the last known healthy release.

## 2. Triggering Triggers
Rollbacks occur:
- **Automatically**: If a new deployment fails liveness/readiness health probes or times out.
- **Manually**: Via the Control Plane API if a customer flags a hidden production bug.

## 3. Rollback Procedure
1. Transition the application's FSM state to `ROLLBACK`.
2. Retrieve the release definition file for the target version.
3. Call the Deployment Engine to execute a rolling update targeting the old release.
4. Verify health of the rolled-back instances.
5. Restore the application's ACTIVE state on completion.
