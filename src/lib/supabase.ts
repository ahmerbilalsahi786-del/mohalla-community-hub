import { createClient } from "@supabase/supabase-js";
import { resolveSupabaseBrowserConfig } from "@/lib/supabase-config";

export const supabaseConfig = resolveSupabaseBrowserConfig();
export const supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey);
