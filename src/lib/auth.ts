const TOKEN_KEY = "mohalla_token";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  unitNumber: string;
  role: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Check expiry
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
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return null;
    }
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
