const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class EnvironmentBuilder {
  constructor(templatesDir) {
    this.templatesDir = templatesDir || path.resolve(__dirname, '../../../templates/tenant');
  }

  build(params) {
    const files = [
      'application.yaml',
      'environment.yaml',
      'volumes.yaml',
      'network.yaml',
      'labels.yaml',
      'monitoring.yaml',
      'backups.yaml',
      'domains.yaml',
      'routing.yaml'
    ];

    let merged = {};
    for (const file of files) {
      const filePath = path.join(this.templatesDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const substituted = this.substitute(content, params);
          const parsed = yaml.load(substituted);
          merged = { ...merged, ...parsed };
        } catch (err) {
          console.error(`Failed to build template ${file}:`, err.message);
        }
      }
    }

    merged.tenant_id = params.tenant_id;
    merged.slug = params.slug || params.tenant_id;
    merged.display_name = params.display_name || params.tenant_id;
    merged.status = params.status || 'CREATING';
    merged.plan = params.plan || 'standard';
    merged.primary_domain = params.primary_domain || `${params.tenant_id}.sj-cloud.test`;
    merged.custom_domains = params.custom_domains || [];
    merged.environment = params.environment || 'development';
    merged.region = params.region || 'local';

    return merged;
  }

  substitute(content, params) {
    return content.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : '';
    });
  }
}

module.exports = {
  EnvironmentBuilder
};
