class ImageGovernanceManager {
  constructor() {
    this.allowedRegistries = ['docker.io', 'gcr.io', 'quay.io', 'ghcr.io'];
  }

  validateImage(imageName) {
    if (imageName.endsWith(':latest')) {
      return { allowed: false, reason: 'Production images must not use :latest tag' };
    }
    const parts = imageName.split('/');
    if (parts.length > 1) {
      const registry = parts[0];
      if (registry.includes('.') && !this.allowedRegistries.includes(registry)) {
        return { allowed: false, reason: `Registry ${registry} is not in the allowed list` };
      }
    }
    return { allowed: true };
  }
}

const globalImageGovernanceManager = new ImageGovernanceManager();
module.exports = { ImageGovernanceManager, globalImageGovernanceManager };
