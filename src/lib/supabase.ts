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

function resolveSupabasePublishableKey(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY;
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
