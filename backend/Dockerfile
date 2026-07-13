FROM node:20-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Source ────────────────────────────────────────────────────────────────────
COPY src/ ./src/

# ── Run as non-root for security ──────────────────────────────────────────────
RUN addgroup -S mindguard && adduser -S mindguard -G mindguard
USER mindguard

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "src/server.js"]
