import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const supabaseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? "https://ytlzepxlwpzeirccwsov.supabase.co"
  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    "sb_publishable_EWGhNG-fnh-7T_u7v7839A_26Ce2ahB"
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
