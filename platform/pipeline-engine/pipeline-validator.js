const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Validator } = require('jsonschema');
const { ValidationError } = require('../shared/errors');

class PipelineValidator {
  constructor() {
    this.validator = new Validator();
    const schemaPath = path.join(__dirname, 'pipeline-schema.yaml');
    if (!fs.existsSync(schemaPath)) {
      throw new ValidationError(`Schema file not found: ${schemaPath}`);
    }
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    this.schema = yaml.load(schemaContent);
  }

  validate(config) {
    const result = this.validator.validate(config, this.schema);
    if (!result.valid) {
      const errMsgs = result.errors.map(err => `${err.property}: ${err.message}`).join(', ');
      throw new ValidationError(`Pipeline validation failed: ${errMsgs}`, { details: { errors: result.errors } });
    }
    return true;
  }
}

module.exports = {
  PipelineValidator
};
