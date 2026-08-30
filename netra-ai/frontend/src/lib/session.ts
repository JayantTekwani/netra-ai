/** Mock session store for the prototype. Replace with real auth later. */
const KEY = "nexus.session";

export interface Session {
  name: string;
  email: string;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}
