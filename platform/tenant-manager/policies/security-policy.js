class SecurityPolicy {
  evaluate(action, tenantId, params = {}) {
    if (action === 'provision') {
      if (!/^[a-z0-9-]+$/.test(tenantId)) {
        return { allowed: false, reason: `Tenant ID format is invalid: ${tenantId}. Must match ^[a-z0-9-]+$` };
      }

      if (params.jwt_secret && params.jwt_secret.length < 32) {
        return { allowed: false, reason: 'JWT secret must be at least 32 characters long' };
      }

      if (params.db_password && params.db_password.length < 12) {
        return { allowed: false, reason: 'Database password must be at least 12 characters long' };
      }
    }

    if (action === 'rotate-secrets') {
      if (params.type === 'jwt' && params.jwt_secret && params.jwt_secret.length < 32) {
        return { allowed: false, reason: 'New JWT secret must be at least 32 characters long' };
      }
    }

    return { allowed: true };
  }
}

module.exports = { SecurityPolicy };
