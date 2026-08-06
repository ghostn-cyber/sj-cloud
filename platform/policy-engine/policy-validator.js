class PolicyValidator {
  validate(policy, resource) {
    if (policy.ruleName === 'ContainerSecurityHardening') {
      if (!resource.securityContext) return { pass: false, reason: 'Missing securityContext' };
      if (resource.securityContext.readOnlyRootFilesystem !== true) return { pass: false, reason: 'readOnlyRootFilesystem must be true' };
      if (resource.securityContext.runAsNonRoot !== true) return { pass: false, reason: 'runAsNonRoot must be true' };
    }
    return { pass: true };
  }
}

const globalPolicyValidator = new PolicyValidator();
module.exports = { PolicyValidator, globalPolicyValidator };
