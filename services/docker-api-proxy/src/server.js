const net = require('net');
const fs = require('fs');
const { translate } = require('./middleware/version-translator');
const { connectToDocker } = require('./adapters/docker-socket');

const PROXY_SOCKET_PATH = process.env.PROXY_SOCKET_PATH || '/etc/traefik/docker-proxy.sock';

/**
 * Structured logger
 */
function log(level, message, extra = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra
  }));
}

// Ensure clean socket startup
if (fs.existsSync(PROXY_SOCKET_PATH)) {
  try {
    fs.unlinkSync(PROXY_SOCKET_PATH);
  } catch (err) {
    log('ERROR', 'Failed to unlink existing socket path', { path: PROXY_SOCKET_PATH, error: err.message });
  }
}

const server = net.createServer((clientSocket) => {
  log('DEBUG', 'Client connection accepted');
  let serverSocket = null;
  let serverConnected = false;
  const clientBuffer = [];

  clientSocket.on('data', (data) => {
    const str = data.toString('binary');
    
    // Intercept and handle native health check
    if (str.startsWith('GET /health ')) {
      const res = 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{"status":"UP"}\n';
      clientSocket.write(Buffer.from(res, 'binary'));
      clientSocket.end();
      return;
    }

    // Intercept and handle native version check
    if (str.startsWith('GET /version ')) {
      const res = 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n{"version":"1.0.0"}\n';
      clientSocket.write(Buffer.from(res, 'binary'));
      clientSocket.end();
      return;
    }

    // Translate legacy client API headers
    const translation = translate(data);
    if (translation.modified) {
      log('INFO', 'Translated legacy client path to v1.40', { request: translation.requestLine });
    }

    if (!serverConnected) {
      clientBuffer.push(translation.data);
      if (!serverSocket) {
        serverSocket = connectToDocker(
          (err) => {
            log('ERROR', 'Docker host socket connection failure', { error: err.message });
            clientSocket.destroy();
          },
          () => {
            log('DEBUG', 'Docker host connection closed');
            clientSocket.end();
          }
        );

        serverSocket.on('connect', () => {
          serverConnected = true;
          log('DEBUG', 'Connection to raw Docker socket established');
          while (clientBuffer.length > 0) {
            serverSocket.write(clientBuffer.shift());
          }
        });

        serverSocket.on('data', (data) => {
          clientSocket.write(data);
        });
      }
    } else {
      serverSocket.write(translation.data);
    }
  });

  clientSocket.on('error', (err) => {
    log('WARN', 'Client connection error', { error: err.message });
    if (serverSocket) serverSocket.destroy();
  });

  clientSocket.on('close', () => {
    log('DEBUG', 'Client connection closed');
    if (serverSocket) serverSocket.end();
  });
});

server.listen(PROXY_SOCKET_PATH, () => {
  log('INFO', 'Docker API translation proxy listening', { socket: PROXY_SOCKET_PATH });
  try {
    fs.chmodSync(PROXY_SOCKET_PATH, '0777');
  } catch (err) {
    log('WARN', 'Failed to adjust socket permissions', { error: err.message });
  }
});

// Graceful Drains
function shutdown() {
  log('INFO', 'SIGTERM received, draining connections');
  server.close(() => {
    log('INFO', 'Draining complete, unlinking socket');
    if (fs.existsSync(PROXY_SOCKET_PATH)) {
      try {
        fs.unlinkSync(PROXY_SOCKET_PATH);
      } catch (err) {
        log('ERROR', 'Failed to unlink socket during shutdown', { error: err.message });
      }
    }
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
