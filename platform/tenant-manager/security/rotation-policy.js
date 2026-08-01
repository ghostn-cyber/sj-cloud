class RotationPolicy {
  constructor(maxAgeDays = 90) {
    this.maxAgeDays = maxAgeDays;
  }

  shouldRotate(lastRotatedTime) {
    if (!lastRotatedTime) return true;
    const ageMs = Date.now() - new Date(lastRotatedTime).getTime();
    const maxAgeMs = this.maxAgeDays * 24 * 60 * 60 * 1000;
    return ageMs >= maxAgeMs;
  }
}

module.exports = { RotationPolicy };
