class StorageContext {
  constructor(volumes) {
    this.volumes = Object.freeze((volumes || []).map(v => Object.freeze({ ...v })));
    Object.freeze(this);
  }
}

module.exports = { StorageContext };
