# ==============================================================================
# Innovative Data Platform - Wasmer.io & Docker Containerfile
# Author: Made by Saif
# ==============================================================================

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV DATABASE_PATH=/app/data/platform.db

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application code
COPY . .

# Ensure data directory exists for persistent SQLite database volume
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 8080 3000

# Health probe for Wasmer / Docker container orchestrator
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/health || exit 1

CMD ["node", "src/server.js"]
