import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'
import { lookupLocationFromCoordinates } from './api/_reverse-geocode.js'

function resolveSupabaseUrl(value?: string) {
  const candidate = value?.trim()
  if (!candidate) throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_URL")

  try {
    const url = new URL(candidate)
    if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co")) {
      return url.toString().replace(/\/$/, "")
    }
  } catch {
    // The explicit error below gives the deployment a useful failure message.
  }

  throw new Error("Supabase URL must be an HTTPS *.supabase.co URL")
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
  const key = values.find((value) => {
    const candidate = value?.trim()
    return candidate ? isBrowserSafeSupabaseKey(candidate) : false
  })
  if (!key) {
    throw new Error("Missing a browser-safe Supabase publishable or anon key")
  }
  return key
}

function resolveApiBaseUrl(value?: string) {
  const candidate = value?.trim()
  if (!candidate) return ""

  try {
    const url = new URL(candidate)
    if (url.hostname.endsWith(".vercel.app")) return ""
    return url.toString().replace(/\/$/, "")
  } catch {
    return ""
  }
}

function reverseGeocodeDevApi() {
  return {
    name: 'mohalla-reverse-geocode-dev-api',
    configureServer(server: any) {
      server.middlewares.use('/api/reverse-geocode', async (req: any, res: any, next: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Allow', 'GET')
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }

        try {
          const requestUrl = new URL(req.url ?? '', 'http://localhost')
          const latitude = Number(requestUrl.searchParams.get('latitude'))
          const longitude = Number(requestUrl.searchParams.get('longitude'))

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'Latitude and longitude are required.' }))
            return
          }

          const location = await lookupLocationFromCoordinates(latitude, longitude)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(location))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Could not read your location details right now.',
          }))
        }
      })
    },
  }
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
    reverseGeocodeDevApi(),
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
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(resolveApiBaseUrl(env.VITE_API_BASE_URL)),
      "import.meta.env.VITE_VAPID_PUBLIC_KEY": JSON.stringify(env.VITE_VAPID_PUBLIC_KEY || ""),
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
      rolldownOptions: {
        input: path.resolve(__dirname, "index.html"),
        output: {
          codeSplitting: {
            minSize: 20_000,
            groups: [
              {
                name: "react-vendor",
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              },
              {
                name: "supabase-vendor",
                test: /node_modules[\\/]@supabase[\\/]/,
              },
              {
                name: "sentry-vendor",
                test: /node_modules[\\/]@sentry[\\/]/,
              },
              {
                name: "query-vendor",
                test: /node_modules[\\/]@tanstack[\\/]/,
              },
              {
                name: "ui-vendor",
                test: /node_modules[\\/](@radix-ui|lucide-react|cmdk|vaul)[\\/]/,
              },
            ],
          },
        },
      },
    },
    base: "/",
  }
})
