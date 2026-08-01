const http = require('http');
const { URL } = require('url');

class HealthChecker {
  /**
   * Fetch status code and body from target url
   * @param {string} targetUrl
   * @returns {Promise<{statusCode: number, body: string}>}
   */
  static fetchStatus(targetUrl) {
    return new Promise((resolve, reject) => {
      let parsed;
      try {
        parsed = new URL(targetUrl);
      } catch (err) {
        return reject(new Error(`Invalid URL: ${targetUrl}`));
      }

      const req = http.get({
        host: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname + parsed.search,
        timeout: 1500
      }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  /**
   * Evaluate liveness and readiness of service config
   * @param {string} serviceId
   * @param {Object} config
   * @returns {Promise<string>} One of: 'Healthy', 'Unhealthy', 'Starting', 'Maintenance'
   */
  static async check(serviceId, config) {
    const containerName = config.routing.container_name;
    const k8sPort = config.kubernetes.port || 80;
    
    const healthUrl = `http://${containerName}:${k8sPort}${config.telemetry.health_endpoint}`;
    const readyUrl = `http://${containerName}:${k8sPort}${config.telemetry.ready_endpoint}`;

    try {
      const healthRes = await this.fetchStatus(healthUrl);
      if (healthRes.statusCode !== 200) {
        return 'Unhealthy';
      }

      // Check maintenance status
      try {
        const body = JSON.parse(healthRes.body);
        if (body.status === 'maintenance') {
          return 'Maintenance';
        }
      } catch (_) {}

      // Liveness ok, check readiness
      try {
        const readyRes = await this.fetchStatus(readyUrl);
        if (readyRes.statusCode === 200) {
          return 'Healthy';
        }
        return 'Starting';
      } catch (_) {
        return 'Starting';
      }
    } catch (err) {
      return 'Unhealthy';
    }
  }
}

module.exports = HealthChecker;
