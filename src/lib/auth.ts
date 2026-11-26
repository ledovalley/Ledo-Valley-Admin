// The login page stores the token in localStorage ("Remember me") or
// sessionStorage (otherwise). Always read and clear both.

const TOKEN_KEY = "admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

/* Replace the token where it is stored now (keeps "Remember me" as it was). */
export function replaceToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(TOKEN_KEY)) localStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

/* When the current login runs out (ms since 1970), or null if unknown. */
export function tokenExpiresAt(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/* The login page, remembering where to come back to. */
export function loginUrl() {
  if (typeof window === "undefined") return "/admin/login";
  const here = window.location.pathname + window.location.search;
  return here.startsWith("/admin") && !here.startsWith("/admin/login")
    ? `/admin/login?next=${encodeURIComponent(here)}`
    : "/admin/login";
}

/* A safe place to go after logging in (only pages inside the admin). */
export function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("//") && !next.startsWith("/admin/login") ? next : "/admin";
}
