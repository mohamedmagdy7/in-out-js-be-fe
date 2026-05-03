import { Response } from "express";
import PDFDocument from "pdfkit";
import { formatDuration } from "../../attendance/attendance.helpers";

interface EmployeeRow {
  user: { full_name: string; department: string | null };
  days_present: number;
  days_absent: number;
  days_late: number;
  days_on_leave: number;
  total_work_minutes: number;
  total_overtime_minutes: number;
  attendance_rate: string;
  has_active_session: boolean;
}

interface PdfInput {
  filename: string;
  company: { name: string; logo_url: string | null };
  period: { from: string; to: string };
  summary: {
    total_employees: number;
    avg_attendance_rate: string;
    total_work_hours: string;
    total_overtime_hours: string;
  };
  employees: EmployeeRow[];
}

export function streamAttendancePdf(res: Response, input: PdfInput) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${input.filename}"`,
  );

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  // Header
  doc.fontSize(18).text(input.company.name, { align: "left" });
  doc.fontSize(14).text("Attendance Report", { align: "left" });
  doc.fontSize(10).text(
    `Period: ${input.period.from} to ${input.period.to}`,
    { align: "left" },
  );
  doc.moveDown();

  // Summary
  doc.fontSize(12).text("Summary", { underline: true });
  doc.fontSize(10);
  doc.text(`Total Employees: ${input.summary.total_employees}`);
  doc.text(`Avg Attendance Rate: ${input.summary.avg_attendance_rate}`);
  doc.text(`Total Work Hours: ${input.summary.total_work_hours}`);
  doc.text(`Total Overtime: ${input.summary.total_overtime_hours}`);
  doc.moveDown();

  // Employees table
  doc.fontSize(12).text("Employees", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(9);

  const colWidths = {
    name: 130,
    dept: 90,
    present: 50,
    absent: 45,
    late: 35,
    leave: 40,
    hours: 60,
    overtime: 55,
    rate: 50,
  };

  const drawHeader = () => {
    const y = doc.y;
    let x = doc.page.margins.left;
    doc.font("Helvetica-Bold");
    doc.text("Name", x, y, { width: colWidths.name });
    x += colWidths.name;
    doc.text("Department", x, y, { width: colWidths.dept });
    x += colWidths.dept;
    doc.text("Present", x, y, { width: colWidths.present });
    x += colWidths.present;
    doc.text("Absent", x, y, { width: colWidths.absent });
    x += colWidths.absent;
    doc.text("Late", x, y, { width: colWidths.late });
    x += colWidths.late;
    doc.text("Leave", x, y, { width: colWidths.leave });
    x += colWidths.leave;
    doc.text("Work", x, y, { width: colWidths.hours });
    x += colWidths.hours;
    doc.text("Overtime", x, y, { width: colWidths.overtime });
    x += colWidths.overtime;
    doc.text("Rate", x, y, { width: colWidths.rate });
    doc.font("Helvetica");
    doc.moveDown();
  };

  drawHeader();

  const pageBottom = doc.page.height - doc.page.margins.bottom - 20;
  for (const emp of input.employees) {
    if (doc.y > pageBottom) {
      doc.addPage();
      drawHeader();
    }
    const y = doc.y;
    let x = doc.page.margins.left;
    const liveMark = emp.has_active_session ? " *" : "";
    doc.text(`${emp.user.full_name}${liveMark}`, x, y, { width: colWidths.name });
    x += colWidths.name;
    doc.text(emp.user.department ?? "-", x, y, { width: colWidths.dept });
    x += colWidths.dept;
    doc.text(String(emp.days_present), x, y, { width: colWidths.present });
    x += colWidths.present;
    doc.text(String(emp.days_absent), x, y, { width: colWidths.absent });
    x += colWidths.absent;
    doc.text(String(emp.days_late), x, y, { width: colWidths.late });
    x += colWidths.late;
    doc.text(String(emp.days_on_leave), x, y, { width: colWidths.leave });
    x += colWidths.leave;
    doc.text(formatDuration(emp.total_work_minutes), x, y, { width: colWidths.hours });
    x += colWidths.hours;
    doc.text(formatDuration(emp.total_overtime_minutes), x, y, {
      width: colWidths.overtime,
    });
    x += colWidths.overtime;
    doc.text(emp.attendance_rate, x, y, { width: colWidths.rate });
    doc.moveDown();
  }

  doc.end();
}
