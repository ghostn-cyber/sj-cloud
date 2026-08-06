class MetricsValidator {
  validate(definition, value, labels = {}) {
    if (!definition) {
      throw new Error(`Metric is not registered`);
    }

    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Metric value must be a number`);
    }

    if (definition.type === 'counter' && value < 0) {
      throw new Error(`Counter metric cannot have negative values`);
    }

    // Verify labels are allowed
    const labelKeys = Object.keys(labels);
    for (const key of labelKeys) {
      if (!definition.allowedLabels.includes(key)) {
        throw new Error(`Label "${key}" is not allowed for metric "${definition.name}"`);
      }
    }
    return true;
  }
}

const globalMetricsValidator = new MetricsValidator();

module.exports = {
  MetricsValidator,
  globalMetricsValidator
};
