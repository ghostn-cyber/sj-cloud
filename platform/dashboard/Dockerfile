FROM node:18-alpine

WORKDIR /app

# Install platform dependencies at the app root level so all submodules can resolve them
COPY platform/dashboard/package.json ./package.json
RUN apk add --no-cache curl && npm install --only=production

# Copy the platform codebase
COPY platform/ platform/

EXPOSE 80

CMD ["node", "platform/dashboard/server.js"]
