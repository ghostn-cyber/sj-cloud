const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Validator } = require('jsonschema');

class SchemaValidator {
  constructor() {
    this.validator = new Validator();
    const schemaPath = path.join(__dirname, 'registry-schema.yaml');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    this.schema = yaml.load(schemaContent);
  }

  /**
   * Validate a service configuration object
   * @param {Object} config The parsed configuration object
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validate(config) {
    const result = this.validator.validate(config, this.schema);
    const errors = result.errors.map(err => `${err.property}: ${err.message}`);
    return {
      valid: result.valid,
      errors
    };
  }
}

module.exports = {
  SchemaValidator
};
