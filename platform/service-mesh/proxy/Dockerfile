FROM node:18-alpine

WORKDIR /app/platform/service-mesh

# Copy package files
COPY platform/service-mesh/package.json ./

# Install production dependencies and curl
RUN apk add --no-cache curl && npm install --only=production

# Copy source code files
COPY platform/service-mesh/ .
COPY platform/shared/ ../shared/
COPY history/ ../../history/

# Expose proxy ports (80 for traffic, 9090 for metrics/admin)
EXPOSE 80 9090

# Run proxy server
CMD ["node", "proxy/server.js"]
