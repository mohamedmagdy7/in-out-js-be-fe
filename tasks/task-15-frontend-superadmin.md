# Task 15 — Frontend: Super Admin Panel

## Goal
The SaaS control panel. Only `SUPER_ADMIN` users see this. Manage all companies, view platform-wide stats, and create HR admin accounts.

## Pages

```
/superadmin                     → platform overview
/superadmin/companies           → company list + management
/superadmin/companies/new       → create company form
/superadmin/companies/:id       → company detail + stats
```

---

## Platform Overview (`/superadmin`)

### Platform Stats
```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Total Companies│ │ Active Companies│ │ Total Employees│ │ Check-Ins Today│
│      12        │ │      11         │ │      487        │ │     391         │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

### Recently Created Companies
Table of the 5 most recently created companies with: Name | Slug | Employees | Status | Created At

---

## Companies List (`/superadmin/companies`)

### Table
Columns: Logo | Company Name | Slug | Timezone | Employees | Status | Created | Actions

- Search by name or slug
- Filter by: Active/Inactive
- "Create Company" button

### Actions per row
- View details → `/superadmin/companies/:id`
- Deactivate/Reactivate (toggle with confirmation modal)

---

## Create Company (`/superadmin/companies/new`)

**Step 1 — Company Info**:
- Company Name (required)
- Slug (auto-generated from name, editable, validated as URL-safe)
- Timezone (searchable dropdown of IANA timezones)
- Daily Hours Threshold (number, default 8)

**Step 2 — First HR Admin**:
- First Name, Last Name
- Email
- Password (with strength indicator)

**Submit** → creates company + HR admin in one action.

Show a success screen with:
- Company details
- HR Admin credentials
- "Copy credentials to clipboard" button
- "Go to company details" link

---

## Company Detail (`/superadmin/companies/:id`)

### Header
Company name, slug, logo, status badge, timezone, created date.

**Actions**: Edit settings | Deactivate | View as HR Admin (impersonation — future feature, show as disabled button for now)

### Stats Section
Real-time company stats pulled from `GET /api/companies/:id/stats`:
```
Active Employees: 40 | Departments: 5 | Checked In Today: 35 | On Leave: 2
```

### HR Admins Tab
Table of HR_ADMIN users for this company:
- Name | Email | Last Login | Status
- "Add HR Admin" button → modal form (email, name, password)
- Deactivate HR Admin

### Company Settings Tab
Read-only view of: timezone, daily hours threshold, leave types, shifts.

---

## Component Structure
```
apps/web/src/app/(superadmin)/
├── superadmin/
│   ├── page.tsx
│   ├── companies/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
└── layout.tsx

apps/web/src/components/superadmin/
├── PlatformStats.tsx
├── CompanyTable.tsx
├── CreateCompanyForm.tsx       → multi-step form
├── CompanyDetailHeader.tsx
├── HRAdminTable.tsx
└── AddHRAdminModal.tsx
```

---

## Multi-Step Form State
Use `react-hook-form` with step tracking:
```typescript
const [step, setStep] = useState<1 | 2>(1)
const form = useForm<CreateCompanyFormData>()

// Step 1: company fields
// Step 2: HR admin fields
// Submit: send all data together
```

---

## Acceptance Criteria
- [ ] Platform stats reflect real counts from the API
- [ ] Slug auto-generates from company name (lowercased, spaces → dashes)
- [ ] Slug field validates: only lowercase letters, numbers, hyphens
- [ ] Creating a company with duplicate slug shows inline error
- [ ] After company creation, success screen shows the HR admin credentials
- [ ] Deactivating a company shows a confirmation modal before proceeding
- [ ] HR admins of a deactivated company cannot log in
- [ ] "Add HR Admin" modal creates the user and shows them in the table immediately
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
