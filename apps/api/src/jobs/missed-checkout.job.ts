import cron, { ScheduledTask } from "node-cron";
import { db } from "@repo/db";
import { DateTime } from "luxon";
import { todayInTimezone } from "../modules/attendance/attendance.helpers";
import { emailService } from "../services/email.service";

const tasks = new Map<string, ScheduledTask>();

export async function runMissedCheckoutForCompany(companyId: string): Promise<number> {
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return 0;

  const today = todayInTimezone(company.timezone);

  const openSessions = await db.attendanceSession.findMany({
    where: {
      company_id: companyId,
      check_out_at: null,
      log: { date: today },
    },
    include: {
      user: { select: { id: true, email: true, first_name: true, is_active: true } },
    },
  });

  let sent = 0;
  for (const session of openSessions) {
    if (!session.user.is_active) continue;

    const dateStr = DateTime.fromJSDate(today).toFormat("yyyy-MM-dd");
    const checkInStr = DateTime.fromJSDate(session.check_in_at)
      .setZone(company.timezone)
      .toFormat("HH:mm");

    try {
      await emailService.sendMissedCheckoutReminder(
        { name: company.name },
        { email: session.user.email, first_name: session.user.first_name },
        dateStr,
        checkInStr,
      );
      sent++;
    } catch (err) {
      console.error(
        `[missed-checkout] failed to notify user ${session.user.id}:`,
        err,
      );
    }
  }

  console.log(
    `[missed-checkout] company=${company.name} reminders_sent=${sent}/${openSessions.length}`,
  );
  return sent;
}

export async function startMissedCheckoutJobs(): Promise<void> {
  const companies = await db.company.findMany({
    where: { is_active: true },
    select: { id: true, timezone: true, name: true },
  });

  for (const company of companies) {
    if (tasks.has(company.id)) continue;
    if (!cron.validate("0 19 * * *")) continue;

    const task = cron.schedule(
      "0 19 * * *",
      () => {
        runMissedCheckoutForCompany(company.id).catch((err) =>
          console.error(`[missed-checkout] error for ${company.name}:`, err),
        );
      },
      { timezone: company.timezone },
    );

    tasks.set(company.id, task);
    console.log(
      `[missed-checkout] scheduled for "${company.name}" at 19:00 ${company.timezone}`,
    );
  }
}

export function stopMissedCheckoutJobs(): void {
  for (const task of tasks.values()) task.stop();
  tasks.clear();
}
