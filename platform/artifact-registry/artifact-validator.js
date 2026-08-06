class ArtifactValidator {
  validate(artifact) {
    const required = ['artifact_id', 'tenant_id', 'type', 'checksum', 'path'];
    for (const field of required) {
      if (!artifact[field]) {
        throw new Error(`Artifact validation failed: missing field "${field}"`);
      }
    }
    return true;
  }
}

module.exports = {
  ArtifactValidator
};
