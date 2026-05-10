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
};
