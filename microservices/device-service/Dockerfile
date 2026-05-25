# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript --save-dev && npx tsc --noEmit || true
RUN npm run build 2>/dev/null || npx tsc

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN addgroup -S zappi && adduser -S zappi -G zappi
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER zappi
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/infrastructure/server.js"]
