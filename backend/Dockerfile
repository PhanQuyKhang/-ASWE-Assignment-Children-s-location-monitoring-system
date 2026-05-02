# syntax=docker/dockerfile:1
# Production API — slim Node on Alpine, non-root, dumb-init for signals
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init && addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY db ./db
COPY src ./src
USER nodejs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
