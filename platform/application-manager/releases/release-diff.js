class ReleaseDiff {
  static compare(releaseA, releaseB) {
    const diffs = {};

    if (releaseA.image_digest !== releaseB.image_digest) {
      diffs.image_digest = { from: releaseA.image_digest, to: releaseB.image_digest };
    }

    if (releaseA.deployment_strategy !== releaseB.deployment_strategy) {
      diffs.deployment_strategy = { from: releaseA.deployment_strategy, to: releaseB.deployment_strategy };
    }

    // Compare environment variables
    const envA = releaseA.environment_snapshot || {};
    const envB = releaseB.environment_snapshot || {};
    const envChanges = {};

    for (const key of new Set([...Object.keys(envA), ...Object.keys(envB)])) {
      if (envA[key] !== envB[key]) {
        envChanges[key] = { from: envA[key] || null, to: envB[key] || null };
      }
    }

    if (Object.keys(envChanges).length > 0) {
      diffs.environment = envChanges;
    }

    return {
      hasChanges: Object.keys(diffs).length > 0,
      diffs
    };
  }
}

module.exports = { ReleaseDiff };
