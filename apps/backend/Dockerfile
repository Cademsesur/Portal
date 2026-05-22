# syntax=docker/dockerfile:1.6

############################################
# Base : node 20 alpine + pnpm via corepack
############################################
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate
WORKDIR /app

############################################
# Stage builder : install deps + build
############################################
FROM base AS builder

# 1. Manifests workspace (cache deps si pas de change)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# 2. Sources
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# 3. Build (ordre : shared → prisma client → backend)
RUN pnpm --filter @sesur/shared build
RUN pnpm --filter @sesur/backend exec prisma generate
RUN pnpm --filter @sesur/backend build

############################################
# Stage runner : runtime minimal
############################################
FROM base AS runner
ENV NODE_ENV=production

# node_modules + sources buildées (les symlinks pnpm sont préservés)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

WORKDIR /app/apps/backend
EXPOSE 4000

# Applique les migrations puis lance le serveur
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
