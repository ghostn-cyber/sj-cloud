const { globalRepositoryRegistry } = require('../registry/repository-registry');
const { globalRepositorySync } = require('./repository-sync');

class BranchSync {
  async getBranches(tenantId, repoId) {
    const repo = globalRepositoryRegistry.getRepository(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    // If branches are empty, run sync to fetch them
    if (!repo.branches || repo.branches.length === 0) {
      const res = await globalRepositorySync.sync(tenantId, repoId);
      return res.branches;
    }
    return repo.branches;
  }
}

const globalBranchSync = new BranchSync();

module.exports = {
  BranchSync,
  globalBranchSync
};
