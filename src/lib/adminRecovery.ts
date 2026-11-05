export const ADMIN_RECOVERY_PATH = "/admin/reset-password";

export function recoveryDestination(hash: string, pathname: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (pathname === ADMIN_RECOVERY_PATH) return null;
  if (params.get("type") === "recovery") return ADMIN_RECOVERY_PATH;
  if (pathname === "/" && params.get("error_code") === "otp_expired") return ADMIN_RECOVERY_PATH;
  return null;
}

// Capture before the auth client consumes and clears the callback fragment.
export const initialRecoveryDestination = typeof window === "undefined"
  ? null
  : recoveryDestination(window.location.hash, window.location.pathname);