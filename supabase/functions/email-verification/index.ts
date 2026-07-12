import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

type VerificationPayload = {
  action?: "send" | "verify";
  userId?: string;
  email?: string;
  token?: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  email_verified_at: string | null;
  email_verification_sent_at: string | null;
  email_verification_expires_at?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, apiKey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char] ?? char;
  });
}

function readJsonSecret(name: string, key = "default") {
  const raw = Deno.env.get(name);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[key] ?? parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

function serviceKey() {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? readJsonSecret("SUPABASE_SECRET_KEYS");
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function displayName(profile: ProfileRow) {
  return profile.display_name ?? profile.full_name ?? profile.email?.split("@")[0] ?? "Resident";
}

function emailLayout(name: string, verificationUrl: string) {
  const safeName = escapeHtml(name);
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">Confirm your Mohalla email</h2>
      <p>Hi ${safeName},</p>
      <p>Please confirm this email address before your Mohalla account can be used.</p>
      <p><a href="${verificationUrl}" style="display:inline-block;background:#2563eb;color:white;padding:10px 14px;border-radius:8px;text-decoration:none">Verify email</a></p>
      <p style="color:#6b7280;font-size:13px">This link expires in 24 hours. If you did not request this, you can ignore this message.</p>
    </div>
  `;
}

async function sendResendEmail(input: {
  resendApiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || "Email provider rejected the verification email.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = serviceKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase function secrets are not configured." }, 500);
  }

  let payload: VerificationPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const action = payload.action ?? "send";

  if (action === "verify") {
    const userId = payload.userId?.trim();
    const token = payload.token?.trim();
    if (!userId || !token) return json({ error: "Verification link is incomplete." }, 400);

    const tokenHash = await sha256(token);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email_verified_at, email_verification_expires_at")
      .eq("id", userId)
      .eq("email_verification_token_hash", tokenHash)
      .maybeSingle<ProfileRow>();

    if (error) return json({ error: error.message }, 500);
    if (!profile) return json({ error: "Verification link is invalid." }, 400);
    if (profile.email_verified_at) return json({ verified: true });
    if (profile.email_verification_expires_at && Date.parse(profile.email_verification_expires_at) < Date.now()) {
      return json({ error: "Verification link has expired. Request a fresh email." }, 400);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email_verified_at: new Date().toISOString(),
        email_verification_token_hash: null,
        email_verification_expires_at: null,
      })
      .eq("id", userId);

    if (updateError) return json({ error: updateError.message }, 500);
    return json({ verified: true });
  }

  const email = payload.email?.trim().toLowerCase();
  const userId = payload.userId?.trim();
  if (!userId && !email) return json({ error: "Email address is required." }, 400);

  let query = supabase
    .from("profiles")
    .select("id, email, display_name, full_name, email_verified_at, email_verification_sent_at")
    .limit(1);
  query = userId ? query.eq("id", userId) : query.ilike("email", email!);

  const { data: profiles, error: profileError } = await query.returns<ProfileRow[]>();
  if (profileError) return json({ error: profileError.message }, 500);

  const profile = profiles?.[0] ?? null;
  if (!profile) {
    if (userId) return json({ error: "Account profile was not found." }, 404);
    return json({ sent: true });
  }

  if (profile.email_verified_at) return json({ sent: false, verified: true });

  const sentAt = profile.email_verification_sent_at ? Date.parse(profile.email_verification_sent_at) : 0;
  if (sentAt && Date.now() - sentAt < 60_000) {
    return json({ sent: true, throttled: true, retryAfterSeconds: 60 });
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
  if (authError || !authUser.user?.email) {
    return json({ error: "Account email was not found." }, 404);
  }

  const targetEmail = authUser.user.email.trim().toLowerCase();
  if (email && targetEmail !== email) return json({ sent: true });

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") ?? "Mohalla <no-reply@mohalla.app>";
  const appUrl = (Deno.env.get("APP_URL") ?? "https://mohallapk.vercel.app").replace(/\/$/, "");
  if (!resendApiKey) {
    return json({ sent: false, skipped: true, reason: "Email provider is not configured." });
  }

  const token = randomToken();
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const verificationUrl = `${appUrl}/verify-email?uid=${encodeURIComponent(profile.id)}&token=${encodeURIComponent(token)}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      email_verification_token_hash: tokenHash,
      email_verification_sent_at: new Date().toISOString(),
      email_verification_expires_at: expiresAt,
    })
    .eq("id", profile.id);

  if (updateError) return json({ error: updateError.message }, 500);

  const name = displayName({ ...profile, email: targetEmail });
  await sendResendEmail({
    resendApiKey,
    from: emailFrom,
    to: targetEmail,
    subject: "Confirm your Mohalla email",
    text: `Hi ${name}, confirm your Mohalla email before using your account: ${verificationUrl}`,
    html: emailLayout(name, verificationUrl),
  });

  return json({ sent: true, expiresAt });
});
