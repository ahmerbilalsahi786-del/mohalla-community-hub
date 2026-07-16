const FALLBACK_SUPABASE_URL = "https://missing-project.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_missing_configuration";

export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
  isConfigured: boolean;
  issues: string[];
};

function normalizeSupabaseUrl(value?: string) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co")) {
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return null;
  }

  return null;
}

function jwtRole(value: string) {
  try {
    const payload = value.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return JSON.parse(atob(padded))?.role ?? null;
  } catch {
    return null;
  }
}

function isBrowserSafeSupabaseKey(value: string) {
  if (value.startsWith("sb_secret_")) return false;
  if (value.startsWith("sb_publishable_")) return true;
  return jwtRole(value) === "anon";
}

function resolvePublishableKey(...values: Array<string | undefined>) {
  return values.find((value) => {
    const candidate = value?.trim();
    return candidate ? isBrowserSafeSupabaseKey(candidate) : false;
  })?.trim() ?? null;
}

export function resolveSupabaseBrowserConfig(env: ImportMetaEnv = import.meta.env): SupabaseBrowserConfig {
  const issues: string[] = [];
  const url = normalizeSupabaseUrl(env.VITE_SUPABASE_URL);
  const publishableKey = resolvePublishableKey(env.VITE_SUPABASE_PUBLISHABLE_KEY, env.VITE_SUPABASE_ANON_KEY);

  if (!url) issues.push("VITE_SUPABASE_URL is missing or invalid.");
  if (!publishableKey) issues.push("VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY is missing or unsafe.");

  return {
    url: url ?? FALLBACK_SUPABASE_URL,
    publishableKey: publishableKey ?? FALLBACK_SUPABASE_PUBLISHABLE_KEY,
    isConfigured: Boolean(url && publishableKey),
    issues,
  };
}
