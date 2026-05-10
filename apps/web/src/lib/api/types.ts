export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AttendanceSession = {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  duration_minutes: number | null;
  formatted_duration: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
};

export type StatusResponse = {
  is_checked_in: boolean;
  active_session: {
    id: string;
    check_in_at: string;
    elapsed_minutes: number | null;
  } | null;
  today_total_minutes: number;
  today_overtime_minutes: number;
  threshold_minutes: number;
  threshold_met: boolean;
  remaining_to_threshold: number;
};

export type TodayLog = {
  id: string;
  date: string;
  status: AttendanceStatus;
  total_work_minutes: number;
  overtime_minutes: number;
  formatted: {
    total_work_hours: string;
    overtime: string;
  };
};

export type TodayResponse = {
  log: TodayLog | null;
  sessions: AttendanceSession[];
  is_checked_in: boolean;
  active_session_id: string | null;
};

export type AttendanceLog = {
  id: string;
  date: string;
  status: AttendanceStatus;
  total_work_minutes: number;
  overtime_minutes: number;
  is_live: boolean;
  formatted: {
    total_work_hours: string;
    overtime: string;
  };
  sessions: AttendanceSession[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
};

export type AttendanceListResponse = {
  data: AttendanceLog[];
  pagination: Pagination;
};

export type LeaveType = {
  id: string;
  name: string;
  days_per_year: number;
  is_paid: boolean;
};

export type LeaveBalance = {
  leave_type: { id: string; name: string; is_paid: boolean };
  days_per_year: number;
  days_used: number;
  days_pending: number;
  days_remaining: number;
};

export type LeaveBalanceResponse = {
  year: number;
  balances: LeaveBalance[];
};

export type LeaveRequest = {
  id: string;
  leave_type_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  leave_type: { id: string; name: string; is_paid: boolean };
  reviewer?: { id: string; first_name: string; last_name: string } | null;
};

export type LeaveRequestsResponse = {
  data: LeaveRequest[];
  pagination: Pagination;
};

export type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    daily_hours_threshold: number;
    weekend_days: number[];
  } | null;
  department: { id: string; name: string } | null;
  shift: {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
  } | null;
  manager: { id: string; first_name: string; last_name: string } | null;
};
