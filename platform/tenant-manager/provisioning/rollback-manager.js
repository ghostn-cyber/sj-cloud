class RollbackManager {
  constructor() {
    this.tasks = [];
  }

  addTask(name, fn) {
    this.tasks.push({ name, fn });
  }

  async execute() {
    console.log('⚠️ Starting rollback pipeline...');
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const task = this.tasks[i];
      console.log(`Executing rollback task: ${task.name}`);
      try {
        await task.fn();
      } catch (err) {
        console.error(`Rollback task failed: ${task.name}:`, err.message);
      }
    }
    this.tasks = [];
  }

  clear() {
    this.tasks = [];
  }
}

module.exports = {
  RollbackManager
};
