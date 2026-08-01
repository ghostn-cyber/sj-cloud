const http = require('http');

class HealthChecker {
  checkHttp(host, port, path, timeout = 2000) {
    return new Promise((resolve) => {
      const options = {
        host,
        port,
        path,
        method: 'GET',
        timeout
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ status: 'HEALTHY', statusCode: res.statusCode });
        } else {
          resolve({ status: 'UNHEALTHY', error: `Bad status code: ${res.statusCode}` });
        }
      });

      req.on('error', (err) => {
        resolve({ status: 'UNHEALTHY', error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'UNHEALTHY', error: 'Request timed out' });
      });

      req.end();
    });
  }
}

module.exports = { HealthChecker };
