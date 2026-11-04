// Manual hold bypass is privileged; ordinary hold-based booking stays unchanged.
export function skipHoldAccessStatus(skipHold: boolean, userId: string | null, roles: readonly string[]): 200 | 401 | 403 {
  if (!skipHold) return 200;
  if (!userId) return 401;
  return roles.some(role => role === "admin_owner" || role === "staff") ? 200 : 403;
}