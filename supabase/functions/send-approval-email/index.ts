import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") ?? "Mohalla <no-reply@mohalla.app>";
  const appUrl = (Deno.env.get("APP_URL") ?? "https://mohallapk.vercel.app").replace(/\/$/, "");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase function secrets are not configured." }, 500);
  }
  if (!resendApiKey) {
    return json({ error: "RESEND_API_KEY is not configured." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization token." }, 401);

  let payload: { userId?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (!payload.userId) return json({ error: "Missing member id." }, 400);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: actor },
    error: actorError,
  } = await supabase.auth.getUser(token);
  if (actorError || !actor) return json({ error: "Unauthorized." }, 401);

  const [{ data: actorProfile }, { data: actorRoles }, { data: targetProfile }] = await Promise.all([
    supabase.from("profiles").select("id, community_id").eq("id", actor.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", actor.id),
    supabase
      .from("profiles")
      .select("id, email, display_name, full_name, community_id, membership_status")
      .eq("id", payload.userId)
      .maybeSingle(),
  ]);

  const isSuperAdmin = actorRoles?.some((row) => row.role === "super_admin") ?? false;
  const isCommunityManager =
    actorRoles?.some((row) => row.role === "admin" || row.role === "moderator") ?? false;
  const sameCommunity =
    Boolean(actorProfile?.community_id) && actorProfile?.community_id === targetProfile?.community_id;

  if (!targetProfile) return json({ error: "Member not found." }, 404);
  if (!isSuperAdmin && (!isCommunityManager || !sameCommunity)) {
    return json({ error: "You cannot email this member." }, 403);
  }
  if (targetProfile.membership_status !== "approved") {
    return json({ error: "Member is not approved yet." }, 409);
  }
  if (!targetProfile.email) return json({ error: "Member has no email address." }, 400);

  const { data: community } = targetProfile.community_id
    ? await supabase.from("community_settings").select("name").eq("id", targetProfile.community_id).maybeSingle()
    : { data: null };

  const communityName = community?.name ?? "your Mohalla community";
  const memberName =
    targetProfile.display_name ?? targetProfile.full_name ?? targetProfile.email.split("@")[0] ?? "Resident";
  const safeName = escapeHtml(memberName);
  const safeCommunity = escapeHtml(communityName);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: targetProfile.email,
      subject: `You're approved for ${communityName}`,
      text: `Hi ${memberName}, your membership in ${communityName} has been approved. You can now sign in at ${appUrl}/login.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2 style="margin:0 0 12px">You're approved</h2>
          <p>Hi ${safeName},</p>
          <p>Your membership in <strong>${safeCommunity}</strong> has been approved.</p>
          <p><a href="${appUrl}/login" style="display:inline-block;background:#2563eb;color:white;padding:10px 14px;border-radius:8px;text-decoration:none">Sign in to Mohalla</a></p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return json({ error: "Approval email could not be sent.", details }, 502);
  }

  return json({ sent: true });
});
