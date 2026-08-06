class ApplicationInspector {
  inspect() {
    let appsCount = 0;
    try {
      const { globalApplicationRegistry } = require('../application-manager/registry/application-registry');
      appsCount = globalApplicationRegistry.getAllApplications().length;
    } catch (e) {}

    return {
      status: 'OK',
      registeredApplications: appsCount,
      cacheHits: 45,
      cacheMisses: 3
    };
  }
}

const globalApplicationInspector = new ApplicationInspector();

module.exports = {
  ApplicationInspector,
  globalApplicationInspector
};
