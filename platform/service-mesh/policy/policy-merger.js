class PolicyMerger {
  static merge(base, ...overrides) {
    const merged = JSON.parse(JSON.stringify(base));

    for (const override of overrides) {
      if (!override) continue;
      
      for (const key of Object.keys(override)) {
        if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
          merged[key] = { ...(merged[key] || {}), ...override[key] };
        } else if (override[key] !== undefined) {
          merged[key] = override[key];
        }
      }
    }

    return merged;
  }
}

module.exports = PolicyMerger;
