# =============================================================================
# Production Dockerfile — Achievement Digest API
# Multi-stage build for optimized Cloud Run deployment
# =============================================================================

# --- Stage 1: Build ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and prisma schema
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy only what's needed for production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Re-generate Prisma client for production OS
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start with db push (creates tables if they don't exist) then run the app
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
