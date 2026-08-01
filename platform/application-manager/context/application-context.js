class ApplicationContext {
  constructor(appConfig) {
    this.application_id = appConfig.application_id;
    this.tenant_id = appConfig.tenant_id;
    this.display_name = appConfig.display_name;
    this.runtime = appConfig.runtime;
    this.image = appConfig.image;
    this.version = appConfig.version;
    this.owner = appConfig.owner;
    Object.freeze(this);
  }
}

module.exports = { ApplicationContext };
