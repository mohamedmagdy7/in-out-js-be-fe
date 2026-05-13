# Builds the apps/api service for production.
# Build from repo root:  docker build -t checkin-api .
# Run:                   docker run --rm -p 8000:8000 --env-file .env checkin-api

FROM node:20-alpine

WORKDIR /app

# pnpm via corepack; tsx runs TS workspace deps directly since @repo/* export src/*.ts
RUN corepack enable \
  && corepack prepare pnpm@9.1.0 --activate \
  && npm install -g tsx

# --- Install deps (cached layer keyed on manifests) ---
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

# --- Copy source ---
COPY apps/api apps/api
COPY packages/db packages/db
COPY packages/shared packages/shared

# --- Generate Prisma client ---
RUN pnpm --filter @repo/db exec prisma generate

ENV NODE_ENV=production
EXPOSE 8000

# Apply migrations on each boot, then start the API.
CMD ["sh", "-c", "pnpm --filter @repo/db exec prisma migrate deploy && cd apps/api && tsx src/index.ts"]
