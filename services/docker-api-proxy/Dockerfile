# Multi-stage build for minimal production-hardened proxy
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./

# Production runtime image
FROM node:20-alpine
WORKDIR /app

# Copy package and source code
COPY --from=builder /app/package.json ./
COPY src/ ./src/

# Enforce non-root user execution (Alpine's default 'node' user UID 1000)
USER node

ENV NODE_ENV=production

# The proxy listens on a Unix socket, so no port needs to be exposed via EXPOSE instruction,
# but we document the target socket volume mount location.
VOLUME ["/etc/traefik"]

# Healthcheck using local socket query client
HEALTHCHECK --interval=5s --timeout=3s --start-period=2s --retries=3 \
  CMD ["node", "src/health/healthcheck.js"]

CMD ["node", "src/server.js"]
