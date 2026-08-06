class PolicyValidator {
  validate(policy) {
    if (!policy || typeof policy.evaluate !== 'function') {
      throw new Error('Invalid policy object: must implement evaluate()');
    }
    return true;
  }
}

module.exports = {
  PolicyValidator
};
