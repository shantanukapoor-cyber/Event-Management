# ─── Stage 1: Build frontend ──────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src/ ./src/
COPY public/ ./public/

RUN npx vite build

# ─── Stage 2: Production server ──────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server code
COPY server/ ./server/

# Copy built frontend from stage 1
COPY --from=build /app/dist ./dist

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server/index.js"]
