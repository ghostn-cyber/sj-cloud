const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { RepositoryValidator } = require('../../platform/repository-manager/registry/repository-validator');
const { PipelineValidator } = require('../../platform/pipeline-engine/pipeline-validator');

const repoValidator = new RepositoryValidator();
const pipeValidator = new PipelineValidator();

let success = true;

// Walk templates directory to validate configurations
const templatesDir = path.resolve(__dirname, '../../templates/pipelines');
if (fs.existsSync(templatesDir)) {
  const files = fs.readdirSync(templatesDir);
  for (const file of files) {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      const fullPath = path.join(templatesDir, file);
      try {
        const doc = yaml.load(fs.readFileSync(fullPath, 'utf8'));
        pipeValidator.validate(doc);
        console.log(`✅ Pipeline template ${file} is valid.`);
      } catch (err) {
        console.error(`❌ Pipeline template ${file} is invalid:`, err.message);
        success = false;
      }
    }
  }
}

if (!success) {
  process.exit(1);
} else {
  console.log(`✅ All CI/CD templates validated successfully.`);
  process.exit(0);
}
