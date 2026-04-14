# Task 01 — Monorepo & Project Scaffold

## Overview

Turborepo monorepo with two apps and two shared packages, managed by pnpm workspaces.

## Project Structure

```
/
├── apps/
│   ├── web/          → Next.js 14 (App Router) + Tailwind CSS
│   └── api/          → Express + TypeScript
├── packages/
│   ├── db/           → Prisma client + schema (@repo/db)
│   └── shared/       → Shared TypeScript types (@repo/shared)
├── turbo.json        → Turborepo pipeline config
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
└── .gitignore
```

## Key Configuration

### Turborepo Pipelines (`turbo.json`)

| Pipeline      | Behavior                          |
| ------------- | --------------------------------- |
| `dev`         | No cache, persistent (watch mode) |
| `build`       | Depends on `^build`, cached       |
| `lint`        | Depends on `^build`               |
| `db:migrate`  | No cache                          |
| `db:generate` | No cache                          |

### TypeScript

All `tsconfig.json` files extend `tsconfig.base.json` at the root. The base config targets ES2022 with `NodeNext` module resolution and strict mode enabled.

- **apps/api**: Compiles to `dist/` via `tsc`
- **apps/web**: Uses Next.js built-in TypeScript handling (bundler module resolution)
- **packages/db** and **packages/shared**: Source `.ts` files are consumed directly by apps via workspace linking

### Workspace Dependencies

- `apps/api` depends on `@repo/db` and `@repo/shared`
- `apps/web` depends on `@repo/shared` (with `transpilePackages` in `next.config.mjs`)

## Apps

### API (`apps/api`)

- **Framework**: Express 4
- **Dev server**: `ts-node-dev --respawn --transpile-only`
- **Port**: 4000 (configurable via `PORT` env var)
- **Middleware**: CORS enabled, JSON body parsing
- **Routes**:
  - `GET /health` → `{ "status": "ok" }`
- **Environment**: Reads `.env` via `dotenv`

### Web (`apps/web`)

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Port**: 3000 (default)
- **Config**: `transpilePackages: ["@repo/shared"]` for workspace package support

## Packages

### `@repo/db`

- Prisma ORM initialized with PostgreSQL provider
- Exports `PrismaClient` instance as `db`
- Schema contains a placeholder model (replaced in Task 02)
- Scripts: `db:generate` and `db:migrate`

### `@repo/shared`

- Exports shared TypeScript types used across apps
- Currently exports: `UserRole` type (`super_admin | hr_admin | manager | employee`)

## Commands

| Command            | Description                                |
| ------------------ | ------------------------------------------ |
| `pnpm install`     | Install all workspace dependencies         |
| `pnpm dev`         | Start web (3000) + api (4000) concurrently |
| `pnpm build`       | Build all packages and apps                |
| `pnpm db:generate` | Generate Prisma client                     |
| `pnpm db:migrate`  | Run Prisma migrations                      |

## Environment Variables

See `.env.example` at the project root. Copy to `.env` and fill in values before running.
