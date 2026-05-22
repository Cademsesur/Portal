# syntax=docker/dockerfile:1.6

############################################
# Base : node 20 alpine + pnpm via corepack
############################################
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.18.2 --activate
WORKDIR /app

############################################
# Stage builder : install + build Next
############################################
FROM base AS builder

# URL backend (relative car servi sous le même domaine via Caddy)
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# 2. Sources
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# 3. Build (shared transpilé par Next mais on build quand même pour stabilité)
RUN pnpm --filter @sesur/shared build
RUN pnpm --filter @sesur/frontend build

############################################
# Stage runner : Next standalone
############################################
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

# Le mode standalone produit un mini bundle node + ses deps
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
