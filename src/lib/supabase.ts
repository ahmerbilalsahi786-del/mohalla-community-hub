import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://ytlzepxlwpzeirccwsov.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EWGhNG-fnh-7T_u7v7839A_26Ce2ahB";

function resolveSupabaseUrl(value?: string) {
  const candidate = value?.trim();
  if (!candidate) return DEFAULT_SUPABASE_URL;

  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co")) {
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // Fall back to the known Mohalla project below.
  }

  return DEFAULT_SUPABASE_URL;
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
  return values.find((value) => {
    const candidate = value?.trim();
    return candidate ? isBrowserSafeSupabaseKey(candidate) : false;
  }) ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ??
  DEFAULT_SUPABASE_URL) as string;
const supabaseKey = (
  resolveSupabasePublishableKey(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
) as string;

if (!supabaseKey) {
  console.error("Missing VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(resolveSupabaseUrl(supabaseUrl), supabaseKey);
