class Queue {
  constructor() {
    this.tasks = [];
    this.dlq = [];
  }

  addTask(task) {
    this.tasks.push(task);
  }

  getPending() {
    return this.tasks.filter(t => t.status === 'Queued');
  }

  getTask(taskId) {
    return this.tasks.find(t => t.id === taskId) || this.dlq.find(t => t.id === taskId);
  }

  getTasksByTenant(tenantId) {
    return [
      ...this.tasks.filter(t => t.tenantId === tenantId),
      ...this.dlq.filter(t => t.tenantId === tenantId)
    ];
  }

  moveToDLQ(task) {
    this.dlq.push(task);
    this.tasks = this.tasks.filter(t => t.id !== task.id);
  }

  getAll() {
    return [...this.tasks, ...this.dlq];
  }
}

const globalQueue = new Queue();

module.exports = {
  Queue,
  globalQueue
};
