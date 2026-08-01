const { globalQueue } = require('./queue');

class Dispatcher {
  dispatch(tenantId, action, params = {}) {
    const task = {
      id: `task-${Math.random().toString(36).substring(2, 11)}`,
      tenantId,
      action,
      params,
      status: 'Queued',
      attempts: 0,
      error: null,
      result: null,
      queuedAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    globalQueue.addTask(task);
    console.log(`[QueueDispatcher] Dispatched task ${task.id} (${action}) for tenant: ${tenantId}`);
    return task;
  }
}

const globalDispatcher = new Dispatcher();

module.exports = {
  Dispatcher,
  globalDispatcher
};
