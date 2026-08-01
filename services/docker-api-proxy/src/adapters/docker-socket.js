const net = require('net');

const DOCKER_SOCKET_PATH = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';

/**
 * Creates a socket connection to the raw host Docker socket.
 * @param {Function} onError - Callback for socket error
 * @param {Function} onClose - Callback for socket close
 * @returns {net.Socket} Connected socket
 */
function connectToDocker(onError, onClose) {
  const client = net.connect(DOCKER_SOCKET_PATH);
  client.on('error', onError);
  client.on('close', onClose);
  return client;
}

module.exports = {
  connectToDocker,
  DOCKER_SOCKET_PATH
};
