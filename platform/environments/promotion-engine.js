const { globalApprovalManager } = require('./approval-manager');
const { globalEnvironmentManager } = require('./environment-manager');
const { globalEventBus } = require('../service-mesh/events');
const { globalDeploymentEngine } = require('../application-manager/deployment/deployment-engine');

class PromotionEngine {
  constructor() {
    this.promotions = new Map();
  }

  async startPromotion(tenantId, appId, releaseId, sourceEnv, targetEnv) {
    const source = globalEnvironmentManager.getEnvironment(sourceEnv);
    const target = globalEnvironmentManager.getEnvironment(targetEnv);

    if (!target) throw new Error(`Invalid target environment: ${targetEnv}`);
    if (source && source.order >= target.order) {
      throw new Error(`Cannot promote backward from ${sourceEnv} to ${targetEnv}`);
    }

    if (!globalEnvironmentManager.canDeploy(targetEnv)) {
      throw new Error(`Environment ${targetEnv} is currently frozen or closed for deployments`);
    }

    const promoId = `promo-${Math.random().toString(36).substr(2, 9)}`;
    const promo = {
      promotionId: promoId,
      tenantId,
      appId,
      releaseId,
      sourceEnv,
      targetEnv,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.promotions.set(promoId, promo);
    globalEventBus.publish('PromotionStarted', { ...promo, timestamp: Date.now() });

    if (target.requiresApproval) {
      globalApprovalManager.requestApproval(promoId, targetEnv);
      return { promotionId: promoId, status: 'PENDING_APPROVAL', requiresApproval: true };
    }

    await this.executePromotion(promoId);
    return this.promotions.get(promoId);
  }

  async executePromotion(promoId) {
    const promo = this.promotions.get(promoId);
    if (!promo) throw new Error(`Promotion not found: ${promoId}`);

    try {
      promo.status = 'DEPLOYING';
      // Execute application deployment
      const result = await globalDeploymentEngine.runDeployment(promo.appId, promo.tenantId, promo.releaseId);
      promo.status = 'SUCCESS';
      promo.completedAt = new Date().toISOString();
      promo.result = result;

      globalEventBus.publish('PromotionCompleted', { ...promo, timestamp: Date.now() });
    } catch (err) {
      promo.status = 'FAILED';
      promo.error = err.message;
      globalEventBus.publish('PromotionFailed', { ...promo, error: err.message, timestamp: Date.now() });
      throw err;
    }
  }

  async approvePromotion(promoId, approverName) {
    const approval = globalApprovalManager.submitApproval(promoId, approverName, 'APPROVED');
    const promo = this.promotions.get(promoId);
    if (!promo) throw new Error(`Promotion not found for approval: ${promoId}`);

    globalEventBus.publish('PromotionApproved', { promoId, approverName, timestamp: Date.now() });
    await this.executePromotion(promoId);
    return promo;
  }

  async rejectPromotion(promoId, approverName) {
    const approval = globalApprovalManager.submitApproval(promoId, approverName, 'REJECTED');
    const promo = this.promotions.get(promoId);
    if (!promo) throw new Error(`Promotion not found for rejection: ${promoId}`);

    promo.status = 'REJECTED';
    promo.rejectedAt = new Date().toISOString();
    promo.rejectedBy = approverName;

    globalEventBus.publish('PromotionRejected', { promoId, approverName, timestamp: Date.now() });
    return promo;
  }

  getPromotion(promoId) {
    return this.promotions.get(promoId);
  }
}

const globalPromotionEngine = new PromotionEngine();

module.exports = {
  PromotionEngine,
  globalPromotionEngine
};
