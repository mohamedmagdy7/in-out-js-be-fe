import type {
  AttendanceStatus,
  LeaveStatus,
} from "@/lib/api/types";
import { Badge } from "./Badge";

const ATTENDANCE_TONE: Record<
  AttendanceStatus,
  "success" | "warning" | "danger" | "primary" | "neutral"
> = {
  PRESENT: "success",
  LATE: "warning",
  HALF_DAY: "warning",
  ABSENT: "danger",
  ON_LEAVE: "primary",
};

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  LATE: "Late",
  HALF_DAY: "Half day",
  ABSENT: "Absent",
  ON_LEAVE: "On leave",
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return <Badge tone={ATTENDANCE_TONE[status]}>{ATTENDANCE_LABEL[status]}</Badge>;
}

const LEAVE_TONE: Record<LeaveStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const LEAVE_LABEL: Record<LeaveStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function LeaveBadge({ status }: { status: LeaveStatus }) {
  return <Badge tone={LEAVE_TONE[status]}>{LEAVE_LABEL[status]}</Badge>;
}
