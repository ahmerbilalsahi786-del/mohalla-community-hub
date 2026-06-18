const TOKEN_KEY = "mohalla_token";
const DEMO_TOKEN_TYPE = "demo";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  unitNumber: string;
  role: string;
}

const DEMO_USER: AuthUser = {
  userId: "ahmed",
  email: "demo@mohalla.app",
  name: "Ahmed Khan",
  unitNumber: "B-204",
  role: "admin",
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function encodeTokenPart(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeTokenPart(value: string): any {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(atob(padded));
}

export function setDemoToken(): void {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
  const payload = {
    typ: DEMO_TOKEN_TYPE,
    sub: DEMO_USER.userId,
    userId: DEMO_USER.userId,
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    unitNumber: DEMO_USER.unitNumber,
    role: DEMO_USER.role,
    exp,
  };

  setToken([
    encodeTokenPart({ alg: "none", typ: "JWT" }),
    encodeTokenPart(payload),
    "demo",
  ].join("."));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = decodeTokenPart(token.split(".")[1]);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = decodeTokenPart(token.split(".")[1]);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return null;
    }
    if (payload.typ === DEMO_TOKEN_TYPE) return DEMO_USER;
    return {
      userId: payload.userId ?? payload.sub,
      email: payload.email,
      name:
        payload.name ??
        payload.user_metadata?.full_name ??
        payload.user_metadata?.name ??
        payload.email?.split("@")[0] ??
        "Resident",
      unitNumber: payload.unitNumber ?? payload.user_metadata?.unit_number ?? "",
      role: payload.role ?? payload.app_metadata?.role ?? "user",
    };
  } catch {
    return null;
  }
}
