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
};
