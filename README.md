# SESUR FLOW

Plateforme interne SESUR de gestion des demandes d'achat — Next.js + NestJS + PostgreSQL, authentification SSO Microsoft Entra ID.

## Stack

- **Monorepo** : pnpm workspaces
- **Frontend** : Next.js 14 (App Router) + TailwindCSS + shadcn/ui + TanStack Query + React Hook Form + Zod
- **Backend** : NestJS 10 + Prisma + PostgreSQL + Redis + BullMQ + Passport (Microsoft + JWT)
- **Partagé** : `@sesur/shared` — schémas Zod + enums (source de vérité unique back/front)
- **Infra dev** : Docker Compose (postgres, redis, mailhog, minio)

## Architecture

### Backend — Clean architecture par module

Chaque module métier sous `apps/backend/src/modules/<module>/` est découpé en 4 couches :

| Couche | Rôle | Dépend de |
|---|---|---|
| `domain/` | Entités, value objects, ports (interfaces). Pure TS, **aucune dépendance framework**. | rien |
| `application/` | Use cases — orchestre le domaine. | `domain/` uniquement |
| `infrastructure/` | Adapters concrets (Prisma repository, clients Resend/S3, strategies Passport). | `domain/` + libs externes |
| `interfaces/` | Controllers HTTP / Gateways WebSocket. | `application/` |

Le module **auth** est implémenté comme référence : voir `SsoLoginUseCase` (application), `JwtStrategy` (infrastructure), `AuthController` (interfaces).

### Frontend — Feature-sliced

```
src/
├── app/                # App Router (pages = orchestration uniquement)
├── features/           # 1 dossier par domaine fonctionnel
│   └── requests/
│       ├── api/        # fetchers
│       ├── hooks/      # TanStack Query
│       ├── components/ # UI specific
│       └── types/
├── components/         # UI réutilisable (shadcn-style)
├── lib/                # utilitaires transverses (api-client, query-client)
└── styles/
```

## Démarrage

### 1. Pré-requis

- Node ≥ 20
- pnpm ≥ 10
- Docker

### 2. Installation

```bash
cd sesur-flow
cp .env.example .env
pnpm install
```

### 3. Lancer la stack Docker (postgres, redis, mailhog, minio)

```bash
pnpm docker:up
```

Interfaces dispo :
- Postgres : `localhost:5432`
- MailHog UI : http://localhost:8025
- MinIO Console : http://localhost:9001 (minioadmin / minioadmin)

### 4. Migration + seed Prisma

```bash
cd apps/backend
pnpm prisma:migrate     # crée la DB
pnpm prisma:seed        # données initiales (admin + DAF + départements)
```

### 5. Lancer backend + frontend

```bash
# depuis la racine
pnpm dev

# ou séparément
pnpm dev:backend     # http://localhost:4000/api/v1 — Swagger sur /api/docs
pnpm dev:frontend    # http://localhost:3000
```

## Scripts utiles

| Commande | Effet |
|---|---|
| `pnpm dev` | Lance backend + frontend en parallèle |
| `pnpm build` | Build tous les packages |
| `pnpm lint` | Lint tous les packages |
| `pnpm format` | Prettier sur tout le repo |
| `pnpm docker:up` / `docker:down` / `docker:logs` | Stack dev |
| `pnpm --filter @sesur/backend prisma:studio` | UI Prisma |

## Phases d'implémentation

1. ✅ **Phase 0** — Bootstrap monorepo, structures, configs (état actuel).
2. ⏳ **Phase 1** — Auth SSO Microsoft réel (Entra ID + JIT) + bootstrap UI shadcn.
3. ⏳ **Phase 2** — CRUD demandes + brouillons + upload pièces jointes.
4. ⏳ **Phase 3** — Workflow d'approbation (state machine, Manager/DAF).
5. ⏳ **Phase 4** — Notifications email (Resend) + in-app (WebSocket).
6. ⏳ **Phase 5** — Génération DOCX/PDF async.
7. ⏳ **Phase 6** — Admin (utilisateurs, départements) + dashboard analytics.
8. ⏳ **Phase 7** — Hardening (tests E2E, sécurité, observabilité, déploiement).

## Conventions

- **Source de vérité validation** : Zod dans `@sesur/shared` → import côté front (React Hook Form resolver) et côté back (pipe).
- **Identité utilisateur** : `entraOid` (Object ID Entra), pas l'email.
- **Pas de mot de passe local** — SSO uniquement.
- **Audit log** sur toute mutation sensible (création, validation, rejet, modif user).
