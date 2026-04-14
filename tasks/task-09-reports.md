# Task 09 — Reports & Export

## Goal
Generate attendance and leave reports. Export to CSV and PDF. HR Admins get company-wide reports; Managers get team reports.

## Endpoints

```
GET  /api/reports/attendance             → attendance report with filters
GET  /api/reports/overtime               → overtime report
GET  /api/reports/leave                  → leave usage report
GET  /api/reports/summary                → company/team dashboard summary
POST /api/reports/export/csv             → export filtered attendance to CSV
POST /api/reports/export/pdf             → export attendance report to PDF
```

---

## Endpoint Specs

### `GET /api/reports/attendance`
Params: `?from=2025-03-01&to=2025-03-31&department_id=&employee_id=&status=`

Access: `HR_ADMIN` (full company), `MANAGER` (own team only)

**Response**:
```json
{
  "period": { "from": "2025-03-01", "to": "2025-03-31" },
  "summary": {
    "total_employees": 40,
    "avg_attendance_rate": "91.2%",
    "total_work_hours": "6142h",
    "total_overtime_hours": "84h"
  },
  "employees": [
    {
      "user": { "id": "...", "full_name": "John Doe", "department": "Engineering" },
      "days_present": 20,
      "days_absent": 1,
      "days_late": 2,
      "days_on_leave": 0,
      "total_work_minutes": 9120,
      "total_overtime_minutes": 60,
      "attendance_rate": "91.0%"
    }
  ]
}
```

### `GET /api/reports/overtime`
Params: `?from=&to=&department_id=&min_hours=1`

Returns employees sorted by overtime descending:
```json
{
  "employees": [
    {
      "user": { "full_name": "...", "department": "..." },
      "total_overtime_minutes": 480,
      "formatted_overtime": "8h 0m",
      "overtime_days": 5
    }
  ]
}
```

### `GET /api/reports/leave`
Params: `?year=2025&department_id=&leave_type_id=`

```json
{
  "employees": [
    {
      "user": { "full_name": "...", "department": "..." },
      "balances": [
        { "type": "Annual Leave", "used": 7, "remaining": 14 }
      ]
    }
  ]
}
```

### `GET /api/reports/summary`
Real-time dashboard numbers for the authenticated user's scope:
```json
{
  "today": {
    "checked_in": 35,
    "not_checked_in": 8,
    "on_leave": 2,
    "late": 4
  },
  "this_month": {
    "avg_attendance_rate": "92.5%",
    "total_overtime_hours": "34h",
    "pending_leave_requests": 5
  }
}
```

---

## Export: CSV

### `POST /api/reports/export/csv`
**Body**: same filters as attendance report
- Generate CSV using `fast-csv` or plain string building
- Stream response with headers:
  ```
  Content-Type: text/csv
  Content-Disposition: attachment; filename="attendance-march-2025.csv"
  ```
- Columns: `Employee Name, Department, Date, Check In, Check Out, Work Hours, Overtime, Status`
- Times formatted in company timezone

---

## Export: PDF

### `POST /api/reports/export/pdf`
- Use `pdfkit` to generate a PDF report
- Include:
  - Company name + logo (if set) at the top
  - Report period
  - Summary table (total employees, avg rate, total hours)
  - Per-employee attendance table
- Stream response with:
  ```
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="attendance-report.pdf"
  ```

---

## File Structure
```
apps/api/src/modules/reports/
├── reports.router.ts
├── reports.controller.ts
├── reports.service.ts
└── exporters/
    ├── csv.exporter.ts
    └── pdf.exporter.ts
```

---

## Dependencies to Install
```
pnpm --filter api add pdfkit fast-csv
pnpm --filter api add -D @types/pdfkit
```

---

## Acceptance Criteria
- [ ] `GET /api/reports/attendance` returns correct per-employee stats for a given month
- [ ] Manager's report only includes their direct reports
- [ ] CSV export downloads a valid `.csv` file with correct headers and data
- [ ] PDF export downloads a formatted `.pdf` file
- [ ] `GET /api/reports/summary` returns today's live check-in counts
- [ ] Overtime report correctly sorts by highest overtime first
- [ ] Documentation added to `docs/` folder covering what was built, API routes, and key decisions
