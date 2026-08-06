const { URL } = require('url');
const configManager = require('../../shared/config/config-manager');
const schema = require('../../shared/config/config-schema');

async function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

async function handleConfigRoute(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (!pathname.startsWith('/admin/config')) return false;

  const sub = pathname.substring(13); // Extract suffix after '/admin/config'

  // GET /admin/config
  if ((sub === '' || sub === '/') && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(configManager.getRedacted()));
    return true;
  }

  // GET /admin/config/runtime
  if ((sub === '/runtime' || sub === 'runtime') && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(configManager.runtimeOverrides || {}));
    return true;
  }

  // GET /admin/config/schema
  if ((sub === '/schema' || sub === 'schema') && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(schema));
    return true;
  }

  // GET /admin/config/health
  if ((sub === '/health' || sub === 'health') && req.method === 'GET') {
    try {
      const config = configManager.getAll();
      const { validate } = require('../../shared/config/config-validator');
      validate(config);
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'VALID', errors: [] }));
    } catch (err) {
      res.statusCode = 200; // Return 200 with invalid status detail
      res.end(JSON.stringify({ status: 'INVALID', error: err.message }));
    }
    return true;
  }

  // POST /admin/config/reload
  if ((sub === '/reload' || sub === 'reload') && req.method === 'POST') {
    try {
      const body = await readBody(req);
      let overrides = {};
      if (body) {
        overrides = JSON.parse(body);
      }
      configManager.reload(overrides);
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'SUCCESS', message: 'Configuration reloaded successfully.' }));
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ status: 'FAILED', error: err.message }));
    }
    return true;
  }

  return false;
}

module.exports = {
  handleConfigRoute
};
