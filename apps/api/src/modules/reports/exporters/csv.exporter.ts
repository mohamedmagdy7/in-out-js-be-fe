import { Response } from "express";
import { format } from "fast-csv";
import { DateTime } from "luxon";
import { formatDuration } from "../../attendance/attendance.helpers";

interface DailyLog {
  date: Date;
  sessions_count: number;
  total_work_minutes: number;
  overtime_minutes: number;
  status: string;
  is_live: boolean;
}

interface EmployeeRow {
  user: { full_name: string; department: string | null };
  daily_logs: DailyLog[];
}

interface ExportInput {
  filename: string;
  timezone: string;
  employees: EmployeeRow[];
}

export function streamAttendanceCsv(res: Response, input: ExportInput) {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${input.filename}"`,
  );

  const stream = format({ headers: true });
  stream.pipe(res);

  for (const emp of input.employees) {
    for (const log of emp.daily_logs) {
      const dateStr = DateTime.fromJSDate(log.date)
        .setZone(input.timezone)
        .toFormat("yyyy-MM-dd");
      stream.write({
        "Employee Name": emp.user.full_name,
        Department: emp.user.department ?? "",
        Date: dateStr,
        "Sessions Count": log.sessions_count,
        "Total Work Hours": formatDuration(log.total_work_minutes),
        Overtime: formatDuration(log.overtime_minutes),
        Status: log.status,
        Live: log.is_live ? "yes" : "",
      });
    }
  }

  stream.end();
}
