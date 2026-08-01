class SecurityContext {
  constructor(runAsNonRoot, readOnlyRootFilesystem) {
    this.run_as_non_root = runAsNonRoot !== false;
    this.read_only_root_filesystem = readOnlyRootFilesystem === true;
    Object.freeze(this);
  }
}

module.exports = { SecurityContext };
