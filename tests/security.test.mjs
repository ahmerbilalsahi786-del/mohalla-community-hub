import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Vercel sends baseline security headers", async () => {
  const config = JSON.parse(await read("vercel.json"));
  const headers = new Map(config.headers[0].headers.map((header) => [header.key, header.value]));
  for (const required of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    assert.ok(headers.has(required), `${required} is required`);
  }
});

test("browser Supabase config rejects secret keys and has no hardcoded project fallback", async () => {
  for (const path of ["vite.config.ts", "src/integrations/supabase/client.ts", "src/lib/supabase.ts"]) {
    const source = await read(path);
    assert.match(source, /sb_secret_/);
    assert.doesNotMatch(source, /DEFAULT_SUPABASE_(URL|PUBLISHABLE_KEY)/);
  }
});

test("production migration protects membership and upload ownership", async () => {
  const migration = await read("supabase/migrations/20260625190000_production_security_and_features.sql");
  assert.match(migration, /revoke all on all tables in schema public from anon/i);
  assert.match(migration, /membership_status = 'approved'/i);
  assert.match(migration, /storage\.foldername\(name\)/i);
  assert.match(migration, /owner_id = auth\.uid\(\)::text/i);
  assert.match(migration, /admin_manage_member/i);
  assert.match(migration, /delete_my_account/i);
});
