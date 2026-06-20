/** Uygulamanın canlı kök adresi (callback ve e-posta linkleri için) */
export function getAppUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function getAuthCallbackUrl() {
  return `${getAppUrl()}/auth/callback`;
}
