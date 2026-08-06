const path = require('path');
const fs = require('fs');
const { globalCredentialStore } = require('../authentication/credential-store');
const { GitHubProvider } = require('../providers/github-provider');
const { GitLabProvider } = require('../providers/gitlab-provider');
const { LocalProvider } = require('../providers/local-provider');
const { globalRepositoryRegistry } = require('../registry/repository-registry');
const { RepositoryEvents } = require('../registry/repository-events');

class RepositorySync {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.providers = {
      github: new GitHubProvider(),
      gitlab: new GitLabProvider(),
      local: new LocalProvider()
    };
  }

  async sync(tenantId, repoId) {
    const repo = globalRepositoryRegistry.getRepository(repoId);
    if (!repo) throw new Error(`Repository not found: ${repoId}`);

    const workspacePath = path.join(this.tenantsDir, tenantId, 'workspaces', repoId);
    const provider = this.providers[repo.provider] || this.providers.local;
    const creds = globalCredentialStore.getCredential(tenantId, repoId);

    try {
      if (!fs.existsSync(workspacePath)) {
        provider.clone(repo.url, workspacePath, creds);
      } else {
        try {
          provider.fetch(workspacePath, creds);
          provider.pull(workspacePath, creds);
        } catch {
          // If fetch/pull fails, re-clone
          provider.clone(repo.url, workspacePath, creds);
        }
      }

      // Discover branches
      const branches = provider.getBranches(repo.url, creds);
      repo.branches = branches;
      repo.sync_status = 'SYNCED';
      repo.updated_at = new Date().toISOString();
      globalRepositoryRegistry.saveRepository(repo, false);

      RepositoryEvents.emit('REPOSITORY_SYNCED', repoId, tenantId, { repo });
      return { success: true, branches };
    } catch (err) {
      repo.sync_status = 'FAILED';
      repo.updated_at = new Date().toISOString();
      globalRepositoryRegistry.saveRepository(repo, false);
      RepositoryEvents.emit('REPOSITORY_SYNC_FAILED', repoId, tenantId, { error: err.message });
      throw err;
    }
  }
}

const globalRepositorySync = new RepositorySync();

module.exports = {
  RepositorySync,
  globalRepositorySync
};
