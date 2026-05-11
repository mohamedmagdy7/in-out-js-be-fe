# UI Theme & Component Reference

A self-contained reference for the web app's design system. Read this before adding new pages or components — it lists the tokens, primitives, and patterns already in place so we don't reinvent them per page.

## Visual Direction

- **Aesthetic:** modern, calm SaaS. Restrained chrome, generous whitespace, light cards on a near-white canvas.
- **Brand accent:** indigo. Used sparingly — primary buttons, focus rings, badges, the brand mark.
- **Surfaces:** layered. Canvas (`background`) → card (`surface`) → muted block (`surface-muted`). Use elevation (shadow + border) instead of strong colors.
- **Type:** Geist Sans (already loaded as `--font-geist-sans`). Default body 14px, headings tracking-tight.
- **Density:** comfortable, not compact. Inputs/buttons are 40px tall (`h-10`) by default.
- **Motion:** subtle. `animate-fade-in` on alerts and route content; no big slide transitions.

## Theming Model

Tokens live as **CSS variables** in `apps/web/src/app/globals.css`, surfaced to Tailwind via the `colors`, `borderRadius`, and `boxShadow` extensions in `tailwind.config.ts`. Each color is stored as raw RGB triplets (`244 245 248`) so Tailwind can apply alpha via `<alpha-value>` syntax (e.g. `bg-primary/20`).

Dark mode uses the **`class` strategy** (`darkMode: "class"` in Tailwind). The `dark` class is set on `<html>` by an inlined script (`ThemeScript`) so the correct theme paints on the first frame — no flash of light theme on reload.

```
:root          → light tokens
.dark          → dark tokens
ThemeScript    → set <html class="dark"> before hydration
useTheme()     → read/set theme; persists choice in localStorage
ThemeToggle    → button that flips between light/dark
```

Toggle precedence: `localStorage("theme")` → `prefers-color-scheme` → light.

## Token Catalog

All tokens are defined in `globals.css`. Use the Tailwind class — never the raw CSS variable from a component.

### Colors

| Tailwind class | Token | Purpose |
|---|---|---|
| `bg-background` | `--background` | Page canvas |
| `bg-surface` | `--surface` | Cards, popovers, sticky headers |
| `bg-surface-muted` | `--surface-muted` | Subtle blocks (table rows, sidebars) |
| `bg-surface-hover` | `--surface-hover` | Hover state for muted surfaces |
| `text-foreground` | `--foreground` | Primary text |
| `text-foreground-muted` | `--foreground-muted` | Secondary text, descriptions |
| `text-foreground-subtle` | `--foreground-subtle` | Tertiary text, hints, placeholders |
| `border-border` | `--border` | Default borders |
| `border-border-strong` | `--border-strong` | Emphasized borders, dividers under hover |
| `ring-ring` | `--ring` | Focus rings |
| `bg-primary` / `text-primary-foreground` | `--primary` / `--primary-foreground` | Brand fills |
| `bg-primary-hover` | `--primary-hover` | Primary hover state |
| `bg-primary-soft` / `text-primary-soft-foreground` | `--primary-soft` | Tinted brand chips, badges |
| `bg-danger` / `text-danger-foreground` | Error fills |
| `bg-danger-soft` / `text-danger-soft-foreground` | Inline error messages |
| `bg-success` / `bg-success-soft` | Success states |
| `bg-warning` / `bg-warning-soft` | Warning states |

### Radius / Shadow / Animation

| Class | Token | Use |
|---|---|---|
| `rounded-sm` | 6px | Pills, inputs-on-input |
| `rounded` | 10px | Buttons, inputs (default) |
| `rounded-lg` | 14px | Cards |
| `rounded-xl` | 20px | Auth card, hero panels |
| `shadow-sm` | subtle | Buttons, default cards |
| `shadow` | medium | Popovers |
| `shadow-lg` | dramatic | Auth card, modal sheets |
| `animate-fade-in` | 200ms ease-out, 4px translate-y | Mounting alerts, page bodies |

### Utilities (custom)

- `.focus-ring` — applies the standard 2-ring focus shadow on `:focus-visible`. Add this to any focusable custom element so focus styling is consistent.
- `.grid-bg` — repeating dot grid background for empty/auth backdrops.

## Component Primitives

Located under `apps/web/src/components/ui/`. Re-exported from `components/ui/index.ts`:

```ts
import { Button, Input, Label, Alert, Card, Badge, Checkbox, ThemeToggle } from "@/components/ui";
```

### `Button`

Variants: `primary` (default), `secondary`, `outline`, `ghost`, `danger`. Sizes: `sm`, `md` (default), `lg`. Built-ins: `loading` (spinner replaces left icon and disables), `fullWidth`, `leftIcon`, `rightIcon`. Always uses the `focus-ring` utility.

```tsx
<Button leftIcon={<Plus className="h-4 w-4" />}>Add employee</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="danger" loading>Deleting…</Button>
```

### `IconButton`

Square (36×36) action button for icon-only triggers. Variants: `ghost` (default), `outline`. Use it for header actions, table row affordances, password show/hide, theme toggle.

### `Input`

Default 40px field. Optional `leftSlot` / `rightSlot` for icons or trailing actions (used by the password show/hide). `invalid` prop turns the border + ring red. Pair with `Label`, `FieldHint`, `FieldError`.

```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" leftSlot={<Mail className="h-4 w-4" />} invalid={!!err} />
{err ? <FieldError>{err.message}</FieldError> : null}
```

### `Card` family

`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter`. Use for any structured content block. Header gets a bottom border; footer gets the muted wash.

### `Alert`

Inline banner. Tones: `info`, `success`, `warning`, `danger`. Auto-fades in. Use it for form-level server errors and for non-blocking notices.

### `Checkbox`

Custom-styled. Accepts a `label` prop to render the label inline — handles the htmlFor wiring for you.

### `Badge`

Small uppercase status pill. Tones mirror `Alert`. Used for role labels in `RoleShell` and for status columns later.

### `ThemeToggle`

Drop-in icon toggle. Lives in headers (login page top-right, role shell header). Reads/writes `localStorage('theme')`.

## App Layout Primitives

### `RoleShell` (`components/auth/RoleShell.tsx`)

The minimal authenticated-page chrome. Sticky header with brand mark, user avatar (initials in primary-soft circle), email, role badge, theme toggle, and sign-out button. Below the header it renders a page title + optional subtitle and a content area that fades in. Used for single-page roles (currently `super_admin`, `hr_admin` placeholders).

```tsx
<RoleShell title="Team overview" subtitle="Live status, attendance, and team reports.">
  {/* page content */}
</RoleShell>
```

### Tabbed role shells: `EmployeeShell`, `ManagerShell`, `AdminShell`, `SuperAdminShell`

For roles with multiple sub-routes, the shells in `components/employee/EmployeeShell.tsx`, `components/manager/ManagerShell.tsx`, `components/admin/AdminShell.tsx`, and `components/superadmin/SuperAdminShell.tsx` use the same sticky header but add a secondary tab bar that highlights the active route via a 0.5px primary underline. The page itself owns its title + subtitle (no `title` prop on the shell). The pattern:

```tsx
// app/<role>/layout.tsx
<AuthGuard>
  <RoleGuard roles={["<role>"]}>
    <RoleShellVariant>{children}</RoleShellVariant>
  </RoleGuard>
</AuthGuard>
```

When you add a new multi-page role, copy one of the existing shells (e.g. `AdminShell.tsx`), swap the `NAV` array, and adjust the role label. The header markup stays identical so all role chromes feel like the same product. `AdminShell` carries 9 entries and uses `overflow-x-auto` on the nav so the bar still scrolls cleanly on narrower viewports — keep that property whenever you grow a nav past ~5 items.

### Auth backdrop (login page)

Centered card on `bg-background` with the dot-grid utility (`grid-bg`) and a soft indigo blur radial behind the card. The card itself is `rounded-xl`, `shadow-lg`, with internal padding `p-6 sm:p-8`. Brand mark is a 48px primary-tinted square with the `Clock3` icon.

## Page Patterns

| Pattern | When to use | Build with |
|---|---|---|
| Authed page | Any role-restricted route | `AuthGuard` → `RoleGuard` → `RoleShell` → cards |
| Public page | Login, future password reset | Centered max-w-md card on grid-bg backdrop |
| Empty state | No data yet | `rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-foreground-muted` (used in tables, lists, tabs) |
| Inline form errors | Field-level | `<FieldError>` under the input |
| Form-level errors | API failures, business-rule blocks | `<Alert tone="danger">` at top of form |
| KPI card | Dashboard summary tiles | `components/admin/KpiCard.tsx` — label, value, optional icon + tone, optional hint |
| Filter bar | Tables with multiple filters | `grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4` |
| Tabbed page section | Sub-views within one route | Pill toggle: `inline-flex w-fit rounded-md border border-border bg-surface p-0.5`, active pill `bg-primary text-primary-foreground shadow-sm` |
| CRUD table | Departments, shifts, leave types | `<table>` inside `rounded-lg border border-border bg-surface shadow-sm`; row actions as `IconButton` group on the right (`Pencil`, `Trash2`); inline rename via swapping the name cell for an `Input` plus check/cancel `IconButton`s |
| Confirm + form modal | Create, edit, delete, override | `Modal` from `components/ui/Modal.tsx` with `footer` holding the action row; destructive actions use `variant="danger"` |

## Conventions

- **Always reach for primitives first.** If you find yourself writing raw button styling, that's a smell — extend the primitive instead.
- **Color usage:** never put primary on a large surface. Primary is for one CTA, focus rings, brand chips, and small accents. Cards stay neutral.
- **Spacing:** cards inside the main content area get `gap-4` in grids. Sections separate with `mt-8`. Inside cards, the header/body ratio is set by the primitive — don't override unless you have a reason.
- **Icons:** `lucide-react`, default `h-4 w-4` for inline UI; `h-6 w-6` for hero/brand contexts. Stroke 2 (default) — use 2.25 only on the brand mark for slightly heavier presence.
- **Never** use `text-black/X`, `bg-white/X`, or hard-coded hex colors in components. Always go through tokens so dark mode and future re-skinning stay free.
- **Focus styling:** add `focus-ring` to any custom focusable element. Inputs include their own focus state.

## File Map

```
apps/web/src/
├── app/
│   ├── globals.css                   ← all CSS variables (light + dark)
│   └── layout.tsx                    ← injects ThemeScript + AuthProvider
├── lib/
│   ├── cn.ts                         ← className join helper
│   └── theme/
│       ├── theme-script.tsx          ← inline pre-hydration theme bootstrapper
│       └── use-theme.ts              ← React hook for theme state
└── components/
    ├── ui/                           ← primitives (Button, Input, Card, Alert, Modal, Select, Textarea, ProgressBar, Spinner, StatusBadge, Toaster, …)
    ├── auth/                         ← AuthGuard, RoleGuard, RoleShell, LoginForm, LogoutButton
    ├── employee/                     ← EmployeeShell + employee-only widgets (Task 12)
    ├── manager/                      ← ManagerShell + manager-only widgets (Task 13)
    ├── admin/                        ← AdminShell, KpiCard, LiveCheckInFeed, EmployeeTable, EmployeeForm, AttendanceOverrideModal, ManualMarkModal, WeekendDaysField (Task 14)
    └── superadmin/                   ← SuperAdminShell, CompanyTable, HRAdminTable, AddHRAdminModal, PasswordStrength (Task 15)
tailwind.config.ts                    ← maps CSS variables onto Tailwind tokens
```

## Adding New Components

1. Style with token classes (`bg-surface`, `text-foreground-muted`, `border-border`). Never hard-code colors.
2. Extend an existing primitive when the difference is tone or size — don't fork.
3. If a new pattern appears in two pages, lift it into `components/ui/` and re-export from `components/ui/index.ts`.
4. Verify both light and dark themes (toggle via the `ThemeToggle` in any page header).
5. Add a row to this doc's component table when the primitive becomes shared.

## Why a Token-Based Theme

Mapping every visible color/border/shadow to a CSS variable means dark mode is one class flip away, future tenant re-branding is a token swap rather than a refactor, and the primitives stay stylistically consistent without each page needing to know the palette. The cost is an extra layer of indirection, paid once.
