# Task 03 — Authentication (JWT + Roles)

## What Was Built

Full JWT-based authentication system in `apps/api` with access + refresh tokens, role-based middleware, and rate-limited login.

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public (rate limited) | Login with email + password |
| POST | `/api/auth/refresh` | Public | Rotate refresh token, get new access token |
| POST | `/api/auth/logout` | Public | Invalidate refresh token, clear cookie |
| GET | `/api/auth/me` | Bearer token | Get current authenticated user |

## Login Flow

1. Client sends `{ email, password, company_slug? }` to `/api/auth/login`
2. If `company_slug` provided → find user by `(email, company_id)` for that company
3. If no `company_slug` → only allow `SUPER_ADMIN` login
4. Verify bcrypt password
5. Issue access token (15m) + refresh token (7d)
6. Store SHA-256 hash of refresh token in `RefreshToken` table
7. Set refresh token as `httpOnly` cookie
8. Return access token + user object in response body

## Token Refresh Flow

1. Read refresh token from cookie or request body
2. Hash it and look up in DB
3. Verify it exists and is not expired
4. Delete old token (rotation)
5. Issue new access + refresh token pair
6. Store new hashed refresh token

## Middleware

| Middleware | File | Purpose |
|------------|------|---------|
| `authenticate` | `middleware/authenticate.ts` | Extracts JWT from `Authorization: Bearer` header, verifies, attaches `req.user` |
| `authorize(...roles)` | `middleware/authorize.ts` | Returns 403 if user's role not in allowed list |
| `requireCompany` | `middleware/authorize.ts` | Ensures `req.user.company_id` exists (blocks SUPER_ADMIN from company-scoped routes) |

## File Structure

```
apps/api/src/
├── modules/
│   └── auth/
│       ├── auth.router.ts       → Route definitions + rate limiter
│       ├── auth.controller.ts   → Express handlers, cookie management
│       ├── auth.service.ts      → Business logic (login, refresh, logout, getMe)
│       └── auth.types.ts        → LoginBody, RefreshBody request types
├── middleware/
│   ├── authenticate.ts          → JWT verification middleware
│   └── authorize.ts             → Role + company guards
└── utils/
    ├── jwt.ts                   → Sign/verify tokens, hash token, expiry calc
    └── password.ts              → bcrypt hash (12 rounds) + compare
```

## Shared Types (`packages/shared/src/auth.types.ts`)

- `JwtPayload` — JWT token payload: `{ sub, email, role, company_id }`
- `AuthUser` — User object returned by API: `{ id, email, first_name, last_name, role, company_id, company_slug }`

## Security Decisions

- **Bcrypt 12 rounds** for password hashing
- **Refresh tokens hashed** with SHA-256 before DB storage (raw token never persisted)
- **Token rotation** on every refresh — old token deleted, new one issued
- **Cookie settings**: `httpOnly`, `sameSite: strict`, `secure` in production
- **Rate limiting**: 10 login attempts per minute per IP via `express-rate-limit`
- **Access token**: 15m expiry (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Refresh token**: 7d expiry (configurable via `JWT_REFRESH_EXPIRES_IN`)

## Environment Variables

```
JWT_ACCESS_SECRET       — Secret for signing access tokens
JWT_REFRESH_SECRET      — Secret for signing refresh tokens
JWT_ACCESS_EXPIRES_IN   — Access token TTL (default: 15m)
JWT_REFRESH_EXPIRES_IN  — Refresh token TTL (default: 7d)
CORS_ORIGIN             — Allowed frontend origin (default: http://localhost:3000)
```

## Dependencies Added

- `jsonwebtoken` + `@types/jsonwebtoken` — JWT signing/verification
- `cookie-parser` + `@types/cookie-parser` — Parse cookies from requests
- `express-rate-limit` — Rate limit login endpoint
- `bcryptjs` + `@types/bcryptjs` — Password hashing
