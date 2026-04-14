# Task 02 — Database Schema (Prisma)

## Goal
Define the full PostgreSQL schema in `packages/db/prisma/schema.prisma`. Run the initial migration. This is the foundation every other task depends on.

## Models to Create

### Company
```
Company {
  id                    String   @id @default(uuid())
  name                  String
  slug                  String   @unique          // used in subdomain/URL
  timezone              String   @default("UTC")
  daily_hours_threshold Float    @default(8)      // hours before overtime kicks in
  logo_url              String?
  is_active             Boolean  @default(true)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  // Relations
  users       User[]
  departments Department[]
  shifts      Shift[]
  leave_types LeaveType[]
}
```

### User
```
User {
  id           String   @id @default(uuid())
  company_id   String
  email        String
  password     String                           // bcrypt hashed
  first_name   String
  last_name    String
  phone        String?
  avatar_url   String?
  role         Role     @default(EMPLOYEE)
  department_id String?
  shift_id     String?
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  @@unique([email, company_id])                // email unique per company

  // Relations
  company           Company
  department        Department?
  shift             Shift?
  attendance_logs   AttendanceLog[]
  leave_requests    LeaveRequest[]
  managed_employees User[]   @relation("ManagerEmployee")
  manager           User?    @relation("ManagerEmployee")
  manager_id        String?
  refresh_tokens    RefreshToken[]
}

enum Role {
  SUPER_ADMIN
  HR_ADMIN
  MANAGER
  EMPLOYEE
}
```

### Department
```
Department {
  id         String   @id @default(uuid())
  company_id String
  name       String
  created_at DateTime @default(now())

  company Company
  users   User[]

  @@unique([company_id, name])
}
```

### Shift
```
Shift {
  id           String   @id @default(uuid())
  company_id   String
  name         String                          // e.g. "Morning", "Night"
  start_time   String                          // "09:00" (24h)
  end_time     String                          // "17:00"
  is_default   Boolean  @default(false)
  created_at   DateTime @default(now())

  company Company
  users   User[]

  @@unique([company_id, name])
}
```

### AttendanceLog
```
AttendanceLog {
  id            String    @id @default(uuid())
  company_id    String
  user_id       String
  date          DateTime  @db.Date             // date only (no time)
  check_in_at   DateTime?
  check_out_at  DateTime?
  check_in_lat  Float?
  check_in_lng  Float?
  check_out_lat Float?
  check_out_lng Float?
  work_minutes  Int?                           // computed on check-out
  overtime_minutes Int?                        // computed on check-out
  notes         String?
  status        AttendanceStatus @default(PRESENT)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  company Company
  user    User

  @@unique([user_id, date])
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  HALF_DAY
  ON_LEAVE
}
```

### LeaveType
```
LeaveType {
  id               String @id @default(uuid())
  company_id       String
  name             String                      // "Annual", "Sick", "Unpaid"
  days_per_year    Int    @default(0)
  is_paid          Boolean @default(true)
  created_at       DateTime @default(now())

  company          Company
  leave_requests   LeaveRequest[]

  @@unique([company_id, name])
}
```

### LeaveRequest
```
LeaveRequest {
  id            String      @id @default(uuid())
  company_id    String
  user_id       String
  leave_type_id String
  start_date    DateTime    @db.Date
  end_date      DateTime    @db.Date
  total_days    Int
  reason        String?
  status        LeaveStatus @default(PENDING)
  reviewed_by   String?
  reviewed_at   DateTime?
  created_at    DateTime    @default(now())
  updated_at    DateTime    @updatedAt

  company    Company
  user       User
  leave_type LeaveType
  reviewer   User?    @relation("LeaveReviewer")
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### RefreshToken
```
RefreshToken {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique
  expires_at DateTime
  created_at DateTime @default(now())

  user User
}
```

## Prisma Middleware (add to `packages/db/src/index.ts`)
Add a soft-delete / company isolation middleware:
- Automatically scope all queries to `company_id` is NOT needed at Prisma level (done in service layer), but add a logging middleware for dev.

## Seed File (`packages/db/prisma/seed.ts`)
Create a seed that inserts:
1. One `Company`: `{ name: "Acme Corp", slug: "acme", timezone: "Africa/Cairo" }`
2. One `SUPER_ADMIN` user: `email: "super@admin.com", password: "Admin123!"`
3. One `HR_ADMIN` user for Acme: `email: "hr@acme.com", password: "Admin123!"`
4. One `MANAGER`: `email: "manager@acme.com", password: "Admin123!"`
5. Two `EMPLOYEE` users
6. Two departments: "Engineering", "Operations"
7. One shift: "Standard" (09:00–17:00), marked as default
8. Two leave types: "Annual Leave" (21 days), "Sick Leave" (10 days)

## Acceptance Criteria
- [ ] `pnpm --filter @repo/db db:migrate` runs without errors
- [ ] `pnpm --filter @repo/db db:seed` populates all seed data
- [ ] All relations and unique constraints are correct
- [ ] `pnpm --filter @repo/db db:generate` generates the Prisma client
- [ ] `@repo/db` exports `db` (PrismaClient instance) and all Prisma types
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions

## Notes
- All `id` fields use UUID (`@default(uuid())`)
- All timestamps in UTC
- `date` fields on `AttendanceLog` and `LeaveRequest` use `@db.Date` (date only, no time)
