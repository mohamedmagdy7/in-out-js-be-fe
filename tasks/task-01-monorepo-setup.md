# Task 01 — Monorepo & Project Scaffold [Done]

## Goal

Bootstrap a Turborepo monorepo with two apps (`web`, `api`) and two shared packages (`db`, `shared`). Everything should run with a single `pnpm dev` from the root.

## What to Build

### Root structure

```
/
├── apps/
│   ├── web/          → Next.js 14 (App Router)
│   └── api/          → Express + Node.js
├── packages/
│   ├── db/           → Prisma client + schema
│   └── shared/       → Shared TypeScript types & utils
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### `apps/web`

- Next.js 14 with App Router
- Tailwind CSS
- TypeScript
- `next.config.js` with `transpilePackages: ['@repo/shared']`

### `apps/api`

- Express + TypeScript
- `ts-node-dev` for dev hot reload
- CORS configured
- Basic health check route: `GET /health → { status: 'ok' }`
- Reads `.env` via `dotenv`

### `packages/db`

- Prisma initialized (empty schema for now — schema comes in Task 02)
- Exports `PrismaClient` as `db`
- Package name: `@repo/db`

### `packages/shared`

- Shared TypeScript types (empty for now, populated in later tasks)
- Package name: `@repo/shared`

### `turbo.json`

- Pipelines for: `dev`, `build`, `lint`, `db:migrate`, `db:generate`

### Root `.env.example`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/checkin_db

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3 (for exports + avatars)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=

# App
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Acceptance Criteria

- [ ] `pnpm install` from root installs all workspaces
- [ ] `pnpm dev` starts both `web` (port 3000) and `api` (port 4000) concurrently
- [ ] `GET http://localhost:4000/health` returns `{ "status": "ok" }`
- [ ] `http://localhost:3000` loads Next.js default page
- [ ] TypeScript compiles without errors in all packages
- [ ] `@repo/shared` types can be imported in both `web` and `api`
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions

## Notes

- Use `pnpm` as the package manager
- Node version: 20+
- All `tsconfig.json` files should extend a root `tsconfig.base.json`
