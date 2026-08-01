const fs = require('fs');
const yaml = require('js-yaml');
const { ValidationError } = require('../../shared/errors');

class ApplicationLoader {
  static load(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new ValidationError(`Application file not found: ${filePath}`);
    }
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return yaml.load(content);
    } catch (err) {
      throw new ValidationError(`Failed to parse application YAML: ${err.message}`);
    }
  }

  static save(filePath, data) {
    try {
      const content = yaml.dump(data);
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (err) {
      throw new ValidationError(`Failed to write application YAML: ${err.message}`);
    }
  }
}

module.exports = { ApplicationLoader };
