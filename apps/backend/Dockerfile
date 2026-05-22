# syntax=docker/dockerfile:1.6

############################################
# Base : node 20 alpine + pnpm via corepack
############################################
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate
WORKDIR /app

############################################
# Stage builder : install + build
############################################
FROM base AS builder

# 1. Manifests workspace (cache deps tant que pas de change)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# 2. Sources
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# 3. Build (shared → prisma client → backend)
RUN pnpm --filter @sesur/shared build
RUN pnpm --filter @sesur/backend exec prisma generate
RUN pnpm --filter @sesur/backend build

############################################
# Stage runner : fresh install + artefacts buildés
# (évite les symlinks pnpm cassés au COPY entre stages)
############################################
FROM base AS runner
ENV NODE_ENV=production

# Manifests + lockfile pour réinstaller les deps proprement
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install complet (devDeps inclus pour avoir la CLI prisma au runtime)
RUN pnpm install --frozen-lockfile

# Copie les artefacts buildés depuis le builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

# Regénère le client Prisma dans l'environnement final
RUN pnpm --filter @sesur/backend exec prisma generate

WORKDIR /app/apps/backend
EXPOSE 4000

# Applique les migrations puis lance le serveur
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main.js"]
