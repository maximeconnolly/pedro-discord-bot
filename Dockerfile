# syntax=docker/dockerfile:1.6
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
