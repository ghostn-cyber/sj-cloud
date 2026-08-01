class TenantDiff {
  static compare(desired, actual) {
    const drifts = [];

    if (!desired) {
      if (actual.workspaceExists) {
        drifts.push({ type: 'orphan_workspace', severity: 'WARNING', message: 'Workspace exists but tenant not in registry' });
      }
      if (actual.routeExists) {
        drifts.push({ type: 'orphan_route', severity: 'WARNING', message: 'Routing rules exist but tenant not in registry' });
      }
      return drifts;
    }

    const { status } = desired;

    // Workspaces and secrets are fundamental for any registered tenant except DELETED
    if (status !== 'DELETED') {
      if (!actual.workspaceExists) {
        drifts.push({ type: 'missing_workspace', severity: 'CRITICAL', message: 'Workspace directory is missing' });
      }
      if (!actual.secretsExist) {
        drifts.push({ type: 'missing_secrets', severity: 'CRITICAL', message: 'Secrets file is missing' });
      }
    }

    if (['ACTIVE', 'SUSPENDED', 'UPDATING', 'RESTORING', 'MIGRATING'].includes(status)) {
      if (!actual.composeFileExists) {
        drifts.push({ type: 'missing_compose', severity: 'CRITICAL', message: 'Docker Compose file is missing' });
      }
      if (!actual.dbExists) {
        drifts.push({ type: 'missing_db', severity: 'CRITICAL', message: 'Database does not exist' });
      }
    }

    if (status === 'ACTIVE') {
      if (!actual.composeRunning) {
        drifts.push({ type: 'stopped_containers', severity: 'HIGH', message: 'Tenant containers are not running' });
      }
      if (!actual.routeExists) {
        drifts.push({ type: 'missing_route', severity: 'HIGH', message: 'Traefik route configuration is missing' });
      }
      if (!actual.certsExist) {
        drifts.push({ type: 'missing_certs', severity: 'HIGH', message: 'TLS certificates are missing' });
      }
    }

    if (status === 'SUSPENDED') {
      if (actual.composeRunning) {
        drifts.push({ type: 'running_but_should_be_suspended', severity: 'MEDIUM', message: 'Containers running for suspended tenant' });
      }
    }

    if (status === 'ARCHIVED') {
      if (actual.composeRunning) {
        drifts.push({ type: 'running_but_should_be_archived', severity: 'HIGH', message: 'Containers running for archived tenant' });
      }
    }

    return drifts;
  }
}

module.exports = { TenantDiff };
