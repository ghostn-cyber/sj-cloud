const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class RepositoryLoader {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  load(tenantId, repositoryId) {
    const repoPath = path.join(this.tenantsDir, tenantId, 'repositories', `${repositoryId}.yaml`);
    if (!fs.existsSync(repoPath)) return null;
    const content = fs.readFileSync(repoPath, 'utf8');
    return yaml.load(content);
  }

  loadAllForTenant(tenantId) {
    const repos = [];
    const reposDir = path.join(this.tenantsDir, tenantId, 'repositories');
    if (fs.existsSync(reposDir) && fs.statSync(reposDir).isDirectory()) {
      const files = fs.readdirSync(reposDir);
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const content = fs.readFileSync(path.join(reposDir, file), 'utf8');
          repos.push(yaml.load(content));
        }
      }
    }
    return repos;
  }
}

module.exports = {
  RepositoryLoader
};
