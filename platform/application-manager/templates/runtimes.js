const runtimes = {
  php: {
    ports: [80],
    command: "apache2-foreground",
    entrypoint: [],
    health: { path: "/index.php", port: 80 },
    volumes: [{ name: "php-app", mount_path: "/var/www/html" }],
    resources: { cpu: "500m", memory: "256Mi" }
  },
  laravel: {
    ports: [80],
    command: "php artisan serve --host=0.0.0.0 --port=80",
    entrypoint: [],
    health: { path: "/up", port: 80 },
    volumes: [{ name: "laravel-storage", mount_path: "/var/www/html/storage" }],
    resources: { cpu: "1000m", memory: "512Mi" }
  },
  nodejs: {
    ports: [3000],
    command: "npm start",
    entrypoint: [],
    health: { path: "/healthz", port: 3000 },
    volumes: [{ name: "node-data", mount_path: "/app/data" }],
    resources: { cpu: "500m", memory: "256Mi" }
  },
  express: {
    ports: [3000],
    command: "node index.js",
    entrypoint: [],
    health: { path: "/health", port: 3000 },
    volumes: [],
    resources: { cpu: "500m", memory: "256Mi" }
  },
  'react-ssr': {
    ports: [3000],
    command: "npm run start:ssr",
    entrypoint: [],
    health: { path: "/", port: 3000 },
    volumes: [],
    resources: { cpu: "1000m", memory: "512Mi" }
  },
  nextjs: {
    ports: [3000],
    command: "npm run start",
    entrypoint: [],
    health: { path: "/api/health", port: 3000 },
    volumes: [],
    resources: { cpu: "1000m", memory: "512Mi" }
  },
  fastapi: {
    ports: [8000],
    command: "uvicorn main:app --host 0.0.0.0 --port 8000",
    entrypoint: [],
    health: { path: "/health", port: 8000 },
    volumes: [],
    resources: { cpu: "500m", memory: "256Mi" }
  },
  go: {
    ports: [8080],
    command: "/app/main",
    entrypoint: [],
    health: { path: "/health", port: 8080 },
    volumes: [],
    resources: { cpu: "200m", memory: "128Mi" }
  },
  rust: {
    ports: [8080],
    command: "/app/server",
    entrypoint: [],
    health: { path: "/health", port: 8080 },
    volumes: [],
    resources: { cpu: "200m", memory: "128Mi" }
  },
  static: {
    ports: [80],
    command: "nginx -g 'daemon off;'",
    entrypoint: [],
    health: { path: "/", port: 80 },
    volumes: [{ name: "html", mount_path: "/usr/share/nginx/html" }],
    resources: { cpu: "100m", memory: "64Mi" }
  },
  worker: {
    ports: [],
    command: "npm run worker",
    entrypoint: [],
    health: null,
    volumes: [],
    resources: { cpu: "500m", memory: "256Mi" }
  },
  cron: {
    ports: [],
    command: "cron -f",
    entrypoint: [],
    health: null,
    volumes: [],
    resources: { cpu: "100m", memory: "64Mi" }
  },
  'background-worker': {
    ports: [],
    command: "python worker.py",
    entrypoint: [],
    health: null,
    volumes: [],
    resources: { cpu: "500m", memory: "256Mi" }
  }
};

module.exports = {
  runtimes
};
