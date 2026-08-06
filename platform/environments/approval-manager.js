class ApprovalManager {
  constructor() {
    this.approvals = new Map();
  }

  requestApproval(promotionId, envName, requiredRole = 'admin') {
    this.approvals.set(promotionId, {
      promotionId,
      envName,
      requiredRole,
      status: 'PENDING',
      decision: null,
      decidedBy: null,
      decidedAt: null
    });
    return this.approvals.get(promotionId);
  }

  submitApproval(promotionId, approverName, decision) {
    const approval = this.approvals.get(promotionId);
    if (!approval) throw new Error(`Approval request not found: ${promotionId}`);
    if (approval.status !== 'PENDING') throw new Error(`Approval request already processed`);

    approval.status = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    approval.decision = decision;
    approval.decidedBy = approverName;
    approval.decidedAt = new Date().toISOString();

    return approval;
  }

  getApproval(promotionId) {
    return this.approvals.get(promotionId);
  }
}

const globalApprovalManager = new ApprovalManager();

module.exports = {
  ApprovalManager,
  globalApprovalManager
};
