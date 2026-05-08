# Task 11 — Frontend: Auth & Role-Based Routing

## What Was Built

Authentication UI for the Next.js 14 (App Router) web app: login page, in-memory session via Zustand, an Axios client with auto-refresh on 401, role-based route guards, and a role-aware home redirect. This is the foundation that the remaining frontend tasks (12–15) build on.

## Routes

| Path           | Access            | Notes                                                                    |
| -------------- | ----------------- | ------------------------------------------------------------------------ |
| `/login`       | Public            | Login form. Redirects authenticated users to their role home.            |
| `/`            | Authenticated     | Reads role from store, redirects to the appropriate dashboard.           |
| `/dashboard`   | `EMPLOYEE`        | Placeholder — wired to Task 12.                                          |
| `/manager`     | `MANAGER`         | Placeholder — wired to Task 13.                                          |
| `/admin`       | `HR_ADMIN`        | Placeholder — wired to Task 14.                                          |
| `/superadmin`  | `SUPER_ADMIN`     | Placeholder — wired to Task 15.                                          |

## File Layout

```
apps/web/src/
├── middleware.ts                              → cookie-based gate (refresh_token presence)
├── app/
│   ├── layout.tsx                             → wraps tree in AuthProvider + ThemeScript
│   ├── globals.css                            → theme tokens (see docs/ui-theme.md)
│   ├── page.tsx                               → role-based redirect
│   ├── login/page.tsx                         → login page
│   ├── dashboard/page.tsx                     → employee placeholder
│   ├── manager/page.tsx                       → manager placeholder
│   ├── admin/page.tsx                         → HR admin placeholder
│   └── superadmin/page.tsx                    → super admin placeholder
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                      → react-hook-form + zod login form
│   │   ├── AuthGuard.tsx                      → blocks unauthenticated users
│   │   ├── RoleGuard.tsx                      → enforces allowed roles per page
│   │   ├── LogoutButton.tsx                   → calls /api/auth/logout, clears store
│   │   └── RoleShell.tsx                      → themed app chrome (header, avatar, role badge, theme toggle, sign-out)
│   └── ui/                                    → shared primitives (Button, Input, Card, Alert, Checkbox, ThemeToggle, …) — see docs/ui-theme.md
└── lib/
    ├── cn.ts                                  → className join helper
    ├── auth/
    │   ├── auth-store.ts                      → Zustand store (user, accessToken, isInitialized)
    │   ├── auth-provider.tsx                  → mounts session restore on app start
    │   ├── api-client.ts                      → Axios instance + interceptors
    │   ├── auth-api.ts                        → login / logout / me wrappers
    │   └── roles.ts                           → role → home path map and ACL helper
    └── theme/
        ├── theme-script.tsx                   → pre-hydration <html class="dark"> bootstrapper
        └── use-theme.ts                       → hook for reading/setting theme (persists in localStorage)
```

## Auth Flow

1. User opens `/login` and fills in email + password. The company slug field is optional — they leave it blank to sign in as a platform super admin, or fill it to sign in to a tenant.
2. `POST /api/auth/login` is called via the Axios client. The API sets the `refresh_token` cookie (httpOnly) and returns `{ access_token, user }`.
3. Access token + user are written into the Zustand store (memory only — never persisted).
4. The form redirects to the user's role home (`getRoleHome(role)`).
5. On full-page reload `AuthProvider` calls `POST /api/auth/refresh` to swap the refresh cookie for a fresh access token, then calls `GET /api/auth/me` to repopulate the user. If either fails, the store is cleared.
6. On any `401` from a protected API call, the response interceptor calls `/api/auth/refresh`, retries the original request once, and on a second 401 clears auth and redirects to `/login`.

## Axios Client (`lib/auth/api-client.ts`)

- `baseURL` from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).
- `withCredentials: true` so the `refresh_token` cookie is sent on `/refresh` and `/logout`.
- **Request interceptor** attaches `Authorization: Bearer <accessToken>` from the store.
- **Response interceptor**:
  - On 401 (excluding `/auth/login` and `/auth/refresh` themselves) it deduplicates concurrent refresh attempts via a single in-flight `refreshPromise`, then retries the original request once with the new token.
  - If refresh fails, the store is cleared and the browser is redirected to `/login`.
- The `_retry` flag on the request config guarantees we never loop more than once.

## Zustand Store (`lib/auth/auth-store.ts`)

```ts
type AuthStore = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
};
```

`isInitialized` becomes `true` after the first restore attempt resolves (success or failure). UI guards use it so the page doesn't flash to `/login` before the refresh attempt completes.

Direct setters (`setAccessTokenDirect`, `clearAuthDirect`) are exported so the Axios interceptor can update auth state without going through React.

## Login Form (`components/auth/LoginForm.tsx`)

- `react-hook-form` + `zod` schema.
- Fields: email, password (with show/hide toggle), **optional** company slug, "Remember me".
- The backend already disambiguates by slug presence: filled → company-user lookup, empty → super-admin lookup. We surface that to the user as a single optional field with the helper text "Leave blank if you're a platform super admin." instead of a mode toggle, since the toggle was redundant UX.
- "Remember me" is sent as `remember_me: true` to the API; the backend already supports extending the refresh-token cookie lifetime via this flag.
- Server-side errors surface as a single inline `Alert` at the top; field-level errors render via `FieldError` below each input.
- The form is built on the shared UI primitives (`Input`, `Button`, `Checkbox`, `Alert`, `Label`) — see `docs/ui-theme.md`.
- On success the user is hydrated into the store and `router.replace(getRoleHome(role))` sends them to their dashboard.

## Route Guards

### `middleware.ts` (Edge runtime)

The access token lives in memory and is not visible to middleware. The API's `refresh_token` cookie is set on `localhost`, so on local dev it is visible to the Next.js app on a different port (cookies are scoped by host, not port).

Middleware uses the **presence** of `refresh_token` as a coarse "likely authenticated" signal:

- No cookie + protected path → redirect to `/login` with `?from=...`.
- Cookie present + on `/login` → redirect to `/`.
- Otherwise pass through.

The actual access-token validity and role membership are enforced client-side by `AuthGuard` and `RoleGuard`. This keeps middleware fast and avoids leaking JWT decoding into the edge runtime.

### `AuthGuard`

Client wrapper used by every protected page. Shows a centered spinner until `isInitialized` flips, then either renders children (if `user`) or redirects to `/login` preserving `?from=`.

### `RoleGuard`

Wraps a page with an explicit allow-list (e.g. `roles={["hr_admin"]}`). If a logged-in user lands on a page outside their role, they are redirected to their own role home rather than `/login`. This satisfies the criterion "Navigating to `/admin` as `EMPLOYEE` redirects to `/dashboard`".

## Logout

`LogoutButton` calls `logout()` from `auth-provider.tsx`, which:

1. Calls `POST /api/auth/logout` (clears the API's refresh-token row and cookie).
2. Clears the Zustand store.
3. Forces a full navigation to `/login` so any in-flight requests are cancelled.

## Key Decisions

- **Access token in memory only**, never in `localStorage` or a non-httpOnly cookie. Reduces XSS impact and matches the API's existing refresh-rotation flow.
- **Single-flight refresh** (`refreshPromise`) avoids a thundering herd of `/auth/refresh` calls when several requests hit a 401 simultaneously after the access token expires.
- **Coarse middleware, fine client**: middleware only checks for the cookie's presence; role enforcement and "real" auth state live on the client where the access token actually lives. This avoids decoding tokens at the edge and keeps middleware logic identical for all roles.
- **`isInitialized` gate**: every guard waits for the first refresh attempt to resolve before deciding to redirect. Without this, a page reload would briefly send the user to `/login` before the silent refresh succeeds.
- **`AuthProvider` runs once** via a `useRef` flag so React Strict Mode's double-mount in dev doesn't fire two refresh requests.

## Acceptance Criteria

- [x] Login with wrong credentials shows inline error message.
- [x] Login with valid credentials redirects to correct role dashboard.
- [x] Page refresh restores session via refresh-token cookie (`AuthProvider` calls `/refresh` + `/me` on mount).
- [x] Navigating to `/admin` as `EMPLOYEE` redirects to `/dashboard` (handled by `RoleGuard`).
- [x] Token expiry (15m) auto-refreshes invisibly to the user (Axios response interceptor).
- [x] Logout clears all auth state and redirects to `/login`.
- [x] Documentation added to `docs/` covering what was built, API routes, and key decisions.

## Dependencies Added

- `zustand` — auth store
- `axios` — HTTP client with interceptors
- `react-hook-form` + `@hookform/resolvers` — form state + validation
- `zod` — schema validation
- `lucide-react` — icons (eye / loader / logout)
