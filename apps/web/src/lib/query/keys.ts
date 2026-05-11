export const queryKeys = {
  attendance: {
    status: ["attendance", "status"] as const,
    today: ["attendance", "today"] as const,
    my: (params: Record<string, unknown> = {}) =>
      ["attendance", "my", params] as const,
  },
  leave: {
    types: ["leave", "types"] as const,
    balance: ["leave", "balance"] as const,
    requests: (params: Record<string, unknown> = {}) =>
      ["leave", "requests", params] as const,
  },
  profile: ["profile"] as const,
  manager: {
    team: (params: Record<string, unknown> = {}) =>
      ["manager", "team", params] as const,
    teamAttendance: (params: Record<string, unknown> = {}) =>
      ["manager", "team-attendance", params] as const,
    leaveRequests: (params: Record<string, unknown> = {}) =>
      ["manager", "leave", params] as const,
    summary: ["manager", "summary"] as const,
    report: (params: Record<string, unknown> = {}) =>
      ["manager", "report", params] as const,
  },
  admin: {
    employees: (params: Record<string, unknown> = {}) =>
      ["admin", "employees", params] as const,
    employee: (id: string) => ["admin", "employee", id] as const,
    departments: ["admin", "departments"] as const,
    shifts: ["admin", "shifts"] as const,
    leaveTypes: ["admin", "leave-types"] as const,
    attendance: (params: Record<string, unknown> = {}) =>
      ["admin", "attendance", params] as const,
    leaveRequests: (params: Record<string, unknown> = {}) =>
      ["admin", "leave", params] as const,
    summary: ["admin", "summary"] as const,
    company: ["admin", "company"] as const,
    companyStats: ["admin", "company-stats"] as const,
    report: (params: Record<string, unknown> = {}) =>
      ["admin", "report", params] as const,
  },
};
