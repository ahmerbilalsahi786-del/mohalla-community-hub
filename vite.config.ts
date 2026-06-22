import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

const DEFAULT_SUPABASE_URL = "https://ytlzepxlwpzeirccwsov.supabase.co"
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_EWGhNG-fnh-7T_u7v7839A_26Ce2ahB"

function resolveSupabaseUrl(value?: string) {
  const candidate = value?.trim()
  if (!candidate) return DEFAULT_SUPABASE_URL

  try {
    const url = new URL(candidate)
    if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co")) {
      return url.toString().replace(/\/$/, "")
    }
  } catch {
    // Fall back to the known Mohalla project below.
  }

  return DEFAULT_SUPABASE_URL
}

function jwtRole(value: string) {
  try {
    const payload = value.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=")
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"))?.role ?? null
  } catch {
    return null
  }
}

function isBrowserSafeSupabaseKey(value: string) {
  if (value.startsWith("sb_secret_")) return false
  if (value.startsWith("sb_publishable_")) return true
  return jwtRole(value) === "anon"
}

function resolveSupabasePublishableKey(...values: Array<string | undefined>) {
  return values.find((value) => {
    const candidate = value?.trim()
    return candidate ? isBrowserSafeSupabaseKey(candidate) : false
  }) ?? DEFAULT_SUPABASE_PUBLISHABLE_KEY
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const supabaseUrl = resolveSupabaseUrl(env.VITE_SUPABASE_URL || env.SUPABASE_URL)
  const supabasePublishableKey =
    resolveSupabasePublishableKey(
      env.VITE_SUPABASE_PUBLISHABLE_KEY,
      env.VITE_SUPABASE_ANON_KEY,
      env.SUPABASE_PUBLISHABLE_KEY,
      env.SUPABASE_ANON_KEY,
    )
  const sentryRelease = env.VITE_SENTRY_RELEASE || env.VERCEL_GIT_COMMIT_SHA
  const shouldUploadSentrySourceMaps = Boolean(env.SENTRY_ORG && env.SENTRY_PROJECT && env.SENTRY_AUTH_TOKEN)
  const plugins = [
    react(),
    tailwindcss(),
    ...(shouldUploadSentrySourceMaps
      ? [
          sentryVitePlugin({
            org: env.SENTRY_ORG,
            project: env.SENTRY_PROJECT,
            authToken: env.SENTRY_AUTH_TOKEN,
            release: sentryRelease ? { name: sentryRelease } : undefined,
            sourcemaps: {
              filesToDeleteAfterUpload: ["dist/**/*.map"],
            },
          }),
        ]
      : []),
  ]

  return {
    root: __dirname,
    plugins,
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabasePublishableKey),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: shouldUploadSentrySourceMaps,
      rollupOptions: {
        input: path.resolve(__dirname, "index.html"),
      },
    },
    base: "/",
  }
})
