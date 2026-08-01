const { Compensation } = require('./compensation');

class TransactionRunner {
  static async run(transaction, context) {
    const executedSteps = [];
    console.log(`[Transaction] Starting transactional workflow for tenant: ${context.tenantId}`);

    for (const step of transaction.getSteps()) {
      try {
        console.log(`[Transaction] Executing step: ${step.name}`);
        await step.execute(context);
        executedSteps.push(step);
      } catch (err) {
        console.error(`[Transaction] Step "${step.name}" failed: ${err.message}`);
        console.log('[Transaction] Initiating rollback (compensation) workflow...');
        
        const compensation = new Compensation(executedSteps);
        await compensation.execute(context);
        
        throw err;
      }
    }

    console.log(`[Transaction] Completed transactional workflow successfully for tenant: ${context.tenantId}`);
    return context;
  }
}

module.exports = { TransactionRunner };
