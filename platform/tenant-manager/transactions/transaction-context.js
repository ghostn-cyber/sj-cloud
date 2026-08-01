class TransactionContext {
  constructor(tenantId, params) {
    this.tenantId = tenantId;
    this.params = params;
    this.secrets = null;
    this.dbName = null;
    this.dbUser = null;
    this.env = null;
    this.workspaceDir = null;
  }
}

module.exports = { TransactionContext };
