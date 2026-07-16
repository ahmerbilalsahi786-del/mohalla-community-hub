import { supabase } from "@/integrations/supabase/client";
import { resolveSupabaseBrowserConfig } from "@/lib/supabase-config";

const ENV_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_API_BASE_URL",
  "VITE_CLOUDINARY_CLOUD_NAME",
  "VITE_LOCATIONIQ_TOKEN",
  "VITE_MAPBOX_TOKEN",
] as const;

export type EnvironmentStatus = {
  name: (typeof ENV_KEYS)[number];
  isSet: boolean;
};

export type HealthStatus = {
  ok: boolean;
  supabaseConfigured: boolean;
  supabaseReachable: boolean;
  sessionStatus: "signed-in" | "signed-out" | "unknown";
  environment: EnvironmentStatus[];
  issues: string[];
};

export function getEnvironmentStatus(): EnvironmentStatus[] {
  return ENV_KEYS.map((name) => ({
    name,
    isSet: Boolean(import.meta.env[name]?.trim()),
  }));
}

export function getAppVersion() {
  return import.meta.env.VITE_APP_VERSION || "1.0.0";
}

export function getLastDeployTime() {
  return import.meta.env.VITE_DEPLOY_TIME || "Not provided";
}

export async function checkHealth(): Promise<HealthStatus> {
  const config = resolveSupabaseBrowserConfig();
  const issues = [...config.issues];
  let supabaseReachable = config.isConfigured;
  let sessionStatus: HealthStatus["sessionStatus"] = "unknown";

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) issues.push(error.message);
    sessionStatus = data.session ? "signed-in" : "signed-out";
  } catch {
    sessionStatus = "unknown";
  }

  if (sessionStatus === "signed-in") {
    try {
      const { error } = await supabase.from("community_settings").select("id").limit(1);
      supabaseReachable = !error;
      if (error) issues.push(error.message);
    } catch (error) {
      supabaseReachable = false;
      issues.push(error instanceof Error ? error.message : "Supabase connection failed.");
    }
  }

  return {
    ok: config.isConfigured && (sessionStatus !== "signed-in" || supabaseReachable),
    supabaseConfigured: config.isConfigured,
    supabaseReachable,
    sessionStatus,
    environment: getEnvironmentStatus(),
    issues,
  };
}
