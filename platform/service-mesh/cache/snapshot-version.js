class SnapshotVersion {
  static incrementBuild(currentBuildNumber = 0) {
    return currentBuildNumber + 1;
  }

  static parseVersion(versionStr) {
    const parts = versionStr.split('.');
    return {
      major: parseInt(parts[0], 10) || 1,
      minor: parseInt(parts[1], 10) || 0,
      patch: parseInt(parts[2], 10) || 0
    };
  }

  static formatVersion(major, minor, patch) {
    return `${major}.${minor}.${patch}`;
  }
}

module.exports = SnapshotVersion;
