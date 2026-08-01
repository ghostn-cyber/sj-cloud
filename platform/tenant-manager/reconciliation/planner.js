const { TenantDiff } = require('../specification/tenant-diff');

class Planner {
  plan(desired, actual) {
    return TenantDiff.compare(desired, actual);
  }
}

module.exports = { Planner };
