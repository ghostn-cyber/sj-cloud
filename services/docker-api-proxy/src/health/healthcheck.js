const net = require('net');

const PROXY_SOCKET_PATH = process.env.PROXY_SOCKET_PATH || '/etc/traefik/docker-proxy.sock';

const client = net.connect(PROXY_SOCKET_PATH);
client.setTimeout(2000);

client.on('connect', () => {
  client.write('GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n');
});

client.on('data', (data) => {
  const str = data.toString('binary');
  if (str.includes('HTTP/1.1 200 OK') && str.includes('"status":"UP"')) {
    console.log('Proxy status check: HEALTHY');
    process.exit(0);
  } else {
    console.error('Proxy status check: UNHEALTHY (Invalid response)', str);
    process.exit(1);
  }
});

client.on('error', (err) => {
  console.error('Proxy status check: UNHEALTHY (Connection failed)', err.message);
  process.exit(1);
});

client.on('timeout', () => {
  console.error('Proxy status check: UNHEALTHY (Timeout)');
  client.destroy();
  process.exit(1);
});
