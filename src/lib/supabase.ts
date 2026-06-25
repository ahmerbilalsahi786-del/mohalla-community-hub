import { createClient } from "@supabase/supabase-js";

function resolveSupabaseUrl(value?: string) {
  const candidate = value?.trim();
  if (!candidate) throw new Error("Missing VITE_SUPABASE_URL.");

  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co")) {
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // The explicit error below keeps configuration failures visible.
  }

  throw new Error("VITE_SUPABASE_URL must be an HTTPS *.supabase.co URL.");
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

function resolveSupabasePublishableKey(...values: Array<string | undefined>) {
  const key = values.find((value) => {
    const candidate = value?.trim();
    return candidate ? isBrowserSafeSupabaseKey(candidate) : false;
  });
  if (!key) {
    throw new Error("Missing a browser-safe Supabase publishable or anon key.");
  }
  return key;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = (
  resolveSupabasePublishableKey(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
) as string;

export const supabase = createClient(resolveSupabaseUrl(supabaseUrl), supabaseKey);
