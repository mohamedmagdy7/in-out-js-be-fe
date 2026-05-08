# Task 11 — Frontend: Auth & Role-Based Routing [Done]

## Goal

Build the authentication UI in Next.js 14 (App Router). Login page, session management, and role-based route guards. This is the foundation all other frontend tasks build on.

## Pages & Routes

```
/login                          → login page (public)
/                               → redirect based on role after login
/dashboard                      → employee dashboard (Task 12)
/manager                        → manager dashboard (Task 13)
/admin                          → HR admin panel (Task 14)
/superadmin                     → super admin panel (Task 15)
```

---

## Auth Flow

1. User visits `/login`, enters email + password + company slug (optional for super admin)
2. Call `POST /api/auth/login`
3. Store `access_token` in memory (Zustand) + `user` object
4. Redirect to role-appropriate dashboard:
   - `EMPLOYEE` → `/dashboard`
   - `MANAGER` → `/manager`
   - `HR_ADMIN` → `/admin`
   - `SUPER_ADMIN` → `/superadmin`
5. On page refresh: call `POST /api/auth/refresh` (cookie-based) to restore session
6. On `401` from any API call: auto-refresh token, retry once, then redirect to `/login`

---

## What to Build

### `apps/web/src/lib/auth/`

```
auth-store.ts          → Zustand store: { user, accessToken, setAuth, clearAuth }
auth-provider.tsx      → Context provider that runs session restore on mount
api-client.ts          → Axios instance with interceptors (auto-attach token, auto-refresh on 401)
```

### Login Page (`app/login/page.tsx`)

- Fields: Email, Password, Company Slug (shown only when not super_admin — add a toggle "Sign in as Super Admin")
- Validation with `react-hook-form` + `zod`
- Show loading state during login
- Show error message on invalid credentials
- Redirect to role dashboard on success

### Route Guards (`middleware.ts` at app root)

Use Next.js `middleware.ts` to:

- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login`
- Enforce role access: `EMPLOYEE` cannot access `/admin`, etc.

Since access tokens are in memory (not cookies), use a `session` cookie (set by the API's refresh token flow) to detect if user is likely authenticated in middleware, then let client-side handle the actual token.

### `components/auth/`

```
LoginForm.tsx
AuthGuard.tsx           → client component that checks auth before rendering children
RoleGuard.tsx           → wraps a page and redirects if role doesn't match
```

---

## Zustand Store Shape

```typescript
type AuthStore = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
};
```

---

## API Client (`lib/api-client.ts`)

```typescript
// Axios instance
const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// Request interceptor: attach Bearer token
// Response interceptor:
//   - on 401: call refresh endpoint, update store, retry original request
//   - on second 401: clearAuth + redirect to /login
```

---

## Design Notes

- Clean, professional login page — company logo placeholder at top
- Show/hide password toggle
- "Remember me" checkbox (extends refresh token to 30d — backend already supports this via cookie)
- Mobile responsive

---

## Acceptance Criteria

- [ ] Login with wrong credentials shows inline error message
- [ ] Login with valid credentials redirects to correct role dashboard
- [ ] Page refresh restores session via refresh token cookie
- [ ] Navigating to `/admin` as `EMPLOYEE` redirects to `/dashboard`
- [ ] Token expiry (15m) auto-refreshes invisibly to the user
- [ ] Logout clears all auth state and redirects to `/login`
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
