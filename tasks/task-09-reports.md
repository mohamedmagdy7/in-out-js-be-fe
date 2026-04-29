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

**Live enrichment rule**: if `to` date includes today (in the company timezone), any employee with an open session must have their active session's elapsed minutes added to their `total_work_minutes` on the fly before aggregating into the report totals. Do **not** persist these values. This ensures the report reflects real-time worked hours for the current day.

```typescript
// In reports.service.ts — for each employee's logs that include today:
const todayLog = employeeLogs.find((l) => isToday(l.date, company.timezone));
if (todayLog) {
  const enriched = enrichWithActiveSession(todayLog, DateTime.now());
  // use enriched.total_work_minutes for this employee's totals
}
```

**Response**:

```json
{
  "period": { "from": "2025-03-01", "to": "2025-03-31" },
  "includes_live_data": true,
  "summary": {
    "total_employees": 40,
    "avg_attendance_rate": "91.2%",
    "total_work_hours": "6142h",
    "total_overtime_hours": "84h"
  },
  "employees": [
    {
      "user": {
        "id": "...",
        "full_name": "John Doe",
        "department": "Engineering"
      },
      "days_present": 20,
      "days_absent": 1,
      "days_late": 2,
      "days_on_leave": 0,
      "total_work_minutes": 9120,
      "total_overtime_minutes": 60,
      "attendance_rate": "91.0%",
      "has_active_session": false
    }
  ]
}
```

`includes_live_data: true` is set when the report period includes today. `has_active_session: true` on an employee row means their hours include an ongoing session. The frontend can show a live indicator next to their row.

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
      "balances": [{ "type": "Annual Leave", "used": 7, "remaining": 14 }]
    }
  ]
}
```

### `GET /api/reports/summary`

Real-time dashboard numbers for the authenticated user's scope. Always reflects live data — open sessions are included in the work hour totals for today.

```json
{
  "today": {
    "checked_in": 35,
    "not_checked_in": 8,
    "on_leave": 2,
    "late": 4,
    "total_live_work_minutes": 14280
  },
  "this_month": {
    "avg_attendance_rate": "92.5%",
    "total_overtime_hours": "34h",
    "pending_leave_requests": 5
  }
}
```

`checked_in` = employees with an open session right now. `total_live_work_minutes` = sum of all employees' enriched work minutes for today (closed sessions + elapsed time of open sessions).

---

## Export: CSV

### `POST /api/reports/export/csv`

**Body**: same filters as attendance report

- Generate CSV using `fast-csv` or plain string building
- Apply the same **live enrichment rule** — if the export range includes today, enrich open sessions before writing rows
- Stream response with headers:
  ```
  Content-Type: text/csv
  Content-Disposition: attachment; filename="attendance-march-2025.csv"
  ```
- Columns: `Employee Name, Department, Date, Sessions Count, Total Work Hours, Overtime, Status, Live`
- The `Live` column is `"yes"` for today's rows with an active session, empty otherwise
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

- [ ] `GET /api/reports/attendance` returns correct per-employee stats for a given past month (no live data)
- [ ] `GET /api/reports/attendance` with a range including today enriches open sessions on the fly — stored log values are not modified
- [ ] `includes_live_data: true` is set when the report range includes today
- [ ] `has_active_session: true` is set on the correct employee rows
- [ ] Manager's report only includes their direct reports
- [ ] `GET /api/reports/summary` `checked_in` count equals number of employees with an open session right now
- [ ] `GET /api/reports/summary` `total_live_work_minutes` includes elapsed time of all open sessions
- [ ] CSV export includes the `Live` column and correctly marks today's active rows
- [ ] PDF export downloads a formatted `.pdf` file
- [ ] Overtime report correctly sorts by highest overtime first
