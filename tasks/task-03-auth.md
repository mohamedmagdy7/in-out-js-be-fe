# Task 03 — Authentication (JWT + Roles) [Done]

## Goal

Build the full auth system in `apps/api`. JWT-based with access + refresh tokens, role-based middleware, and a `super_admin` bootstrap flow.

## Endpoints to Build

### Public routes (no auth required)

```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Protected (any authenticated user)

```
GET  /api/auth/me
```

---

## Endpoint Specs

### `POST /api/auth/login`

**Body**: `{ email, password, company_slug? }`

- If `company_slug` is provided → find user by `(email, company_id)` for that company
- If no `company_slug` → only allow `SUPER_ADMIN` login (they're not tied to a company)
- Verify bcrypt password
- Return access token (15m) + refresh token (7d)
- Store refresh token in `RefreshToken` table
- Set refresh token as `httpOnly` cookie as well

**Response**:

```json
{
  "access_token": "...",
  "user": {
    "id": "...",
    "email": "...",
    "first_name": "...",
    "last_name": "...",
    "role": "EMPLOYEE",
    "company_id": "...",
    "company_slug": "acme"
  }
}
```

### `POST /api/auth/refresh`

- Read refresh token from cookie or body `{ refresh_token }`
- Verify it exists in DB and is not expired
- Issue new access token
- Rotate refresh token (delete old, insert new)

### `POST /api/auth/logout`

- Invalidate refresh token from DB
- Clear cookie

### `GET /api/auth/me`

- Requires `Authorization: Bearer <token>`
- Return current user (no password)

---

## Middleware to Build

### `authenticate` middleware

- Extract JWT from `Authorization: Bearer` header
- Verify and decode using `JWT_ACCESS_SECRET`
- Attach `req.user = { id, email, role, company_id }` to request
- Return `401` if missing or invalid

### `authorize(...roles: Role[])` middleware

- Usage: `router.get('/admin', authenticate, authorize('HR_ADMIN', 'SUPER_ADMIN'), handler)`
- Returns `403` if user's role is not in allowed list

### `requireCompany` middleware

- Ensures `req.user.company_id` exists
- Used to block `SUPER_ADMIN` from company-scoped routes

---

## File Structure

```
apps/api/src/
├── modules/
│   └── auth/
│       ├── auth.router.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.types.ts
├── middleware/
│   ├── authenticate.ts
│   └── authorize.ts
└── utils/
    ├── jwt.ts          → signAccessToken, signRefreshToken, verifyToken
    └── password.ts     → hashPassword, comparePassword
```

---

## Shared Types (`packages/shared/src/auth.types.ts`)

```typescript
export type JwtPayload = {
  sub: string; // user id
  email: string;
  role: Role;
  company_id: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  company_id: string | null;
  company_slug: string | null;
};
```

---

## Security Requirements

- Passwords hashed with bcrypt (rounds: 12)
- Access token expires in `JWT_ACCESS_EXPIRES_IN` (default 15m)
- Refresh token expires in `JWT_REFRESH_EXPIRES_IN` (default 7d)
- Refresh tokens stored hashed in DB (SHA-256)
- `httpOnly`, `sameSite: 'strict'`, `secure: true` (in production) on refresh token cookie
- Rate limit login to 10 req/min per IP (use `express-rate-limit`)

---

## Acceptance Criteria

- [ ] `POST /api/auth/login` with seed HR admin credentials returns tokens
- [ ] `GET /api/auth/me` with valid token returns user
- [ ] `GET /api/auth/me` with expired/missing token returns `401`
- [ ] Accessing an `HR_ADMIN`-only route with an `EMPLOYEE` token returns `403`
- [ ] Refresh token rotation works (old token invalidated after refresh)
- [ ] `POST /api/auth/logout` removes refresh token from DB
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
