FROM node:18-alpine

WORKDIR /app/platform/testing/mock-service

COPY package.json ./
RUN apk add --no-cache curl && npm install --only=production

COPY . .

EXPOSE 80

CMD ["node", "server.js"]
