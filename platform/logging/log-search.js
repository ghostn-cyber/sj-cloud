const { globalLogReader } = require('./log-reader');

class LogSearch {
  search(criteria = {}) {
    const entries = globalLogReader.readAll();
    return entries.filter(entry => {
      if (criteria.level && entry.level !== criteria.level) return false;
      if (criteria.scope && entry.scope !== criteria.scope) return false;
      if (criteria.tenantId && entry.tenantId !== criteria.tenantId) return false;
      if (criteria.appId && entry.appId !== criteria.appId) return false;
      if (criteria.service && entry.service !== criteria.service) return false;
      if (criteria.query) {
        const q = criteria.query.toLowerCase();
        const msgMatch = entry.message && entry.message.toLowerCase().includes(q);
        if (!msgMatch) return false;
      }
      return true;
    });
  }
}

const globalLogSearch = new LogSearch();

module.exports = {
  LogSearch,
  globalLogSearch
};
