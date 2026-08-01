const http = require('http');
const { LifecycleError } = require('../../shared/errors');

class HealthVerifier {
  verify(domain, maxRetries = 10, intervalMs = 1000) {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const attempt = () => {
        attempts++;
        const checkPort = process.env.TRAEFIK_HTTP_PORT || 80;
        const options = {
          hostname: '127.0.0.1',
          port: checkPort,
          path: '/health',
          headers: {
            Host: domain
          },
          timeout: 2000
        };

        const req = http.get(options, (res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            retryOrReject(new Error(`Bad status code: ${res.statusCode}`));
          }
        });

        req.on('error', (err) => {
          retryOrReject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          retryOrReject(new Error('Timeout'));
        });
      };

      const retryOrReject = (err) => {
        if (attempts >= maxRetries) {
          reject(new LifecycleError(`Health verification failed for domain ${domain} after ${maxRetries} attempts: ${err.message}`, { rootCause: err }));
        } else {
          setTimeout(attempt, intervalMs);
        }
      };

      attempt();
    });
  }
}

module.exports = {
  HealthVerifier
};
