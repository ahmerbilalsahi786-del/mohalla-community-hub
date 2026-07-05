import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

type ApprovalEvent = "pending" | "approved";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  community_id: string | null;
  membership_status: string | null;
};

type Community = {
  id: string;
  name: string | null;
  status: string | null;
  requested_by_user_id: string | null;
};

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

function personName(profile?: Partial<Profile> | null) {
  return profile?.display_name ?? profile?.full_name ?? profile?.email?.split("@")[0] ?? "Resident";
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

function emailLayout(title: string, body: string, actionLabel: string, actionUrl: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">${escapeHtml(title)}</h2>
      <p>${body}</p>
      <p><a href="${actionUrl}" style="display:inline-block;background:#2563eb;color:white;padding:10px 14px;border-radius:8px;text-decoration:none">${escapeHtml(actionLabel)}</a></p>
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
    throw new Error(details || "Email provider rejected the message.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = serviceKey();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") ?? "Mohalla <no-reply@mohalla.app>";
  const appUrl = (Deno.env.get("APP_URL") ?? "https://mohallapk.vercel.app").replace(/\/$/, "");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase function secrets are not configured." }, 500);
  }
  if (!resendApiKey) {
    return json({
      sent: false,
      count: 0,
      skipped: true,
      reason: "Email provider is not configured.",
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization token." }, 401);

  let payload: { userId?: string; event?: ApprovalEvent };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const targetUserId = payload.userId?.trim();
  const event: ApprovalEvent = payload.event === "pending" ? "pending" : "approved";
  if (!targetUserId) return json({ error: "Missing member id." }, 400);

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
      .eq("id", targetUserId)
      .maybeSingle(),
  ]);

  if (!targetProfile) return json({ error: "Member not found." }, 404);

  const typedTarget = targetProfile as Profile;
  const isSuperAdmin = actorRoles?.some((row) => row.role === "super_admin") ?? false;
  const isCommunityManager =
    actorRoles?.some((row) => row.role === "admin" || row.role === "moderator") ?? false;
  const sameCommunity =
    Boolean(actorProfile?.community_id) && actorProfile?.community_id === typedTarget.community_id;
  const isSelf = actor.id === typedTarget.id;

  const { data: communityRow } = typedTarget.community_id
    ? await supabase
        .from("community_settings")
        .select("id, name, status, requested_by_user_id")
        .eq("id", typedTarget.community_id)
        .maybeSingle()
    : { data: null };

  const community = communityRow as Community | null;
  const isCommunityRequest = community?.requested_by_user_id === typedTarget.id;

  if (event === "approved" && !isSuperAdmin && (!isCommunityManager || !sameCommunity)) {
    return json({ error: "You cannot email this member." }, 403);
  }

  if (event === "pending" && !isSelf && !isSuperAdmin && (!isCommunityManager || !sameCommunity)) {
    return json({ error: "You cannot email this member." }, 403);
  }

  if (event === "approved") {
    if (isCommunityRequest) {
      if (community?.status !== "approved") return json({ error: "Community is not approved yet." }, 409);
    } else if (typedTarget.membership_status !== "approved") {
      return json({ error: "Member is not approved yet." }, 409);
    }
  }

  if (event === "pending") {
    const pendingCommunityRequest = isCommunityRequest && community?.status === "pending";
    const pendingMemberRequest = typedTarget.membership_status === "pending";
    if (!pendingCommunityRequest && !pendingMemberRequest) {
      return json({ error: "This request is not pending." }, 409);
    }
  }

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("notify_approvals")
    .eq("user_id", typedTarget.id)
    .maybeSingle();

  const memberName = personName(typedTarget);
  const communityName = community?.name ?? "your Mohalla community";
  const safeName = escapeHtml(memberName);
  const safeCommunity = escapeHtml(communityName);
  const loginUrl = `${appUrl}/login`;
  const sentTo: string[] = [];

  if (typedTarget.email && (prefs?.notify_approvals ?? true)) {
    const subject =
      event === "approved"
        ? isCommunityRequest
          ? `Your society is approved on Mohalla`
          : `You're approved for ${communityName}`
        : isCommunityRequest
          ? `Your society request is pending`
          : `Your request for ${communityName} is pending`;

    const text =
      event === "approved"
        ? isCommunityRequest
          ? `Hi ${memberName}, your society ${communityName} has been approved on Mohalla. You can now sign in at ${loginUrl}.`
          : `Hi ${memberName}, your membership in ${communityName} has been approved. You can now sign in at ${loginUrl}.`
        : isCommunityRequest
          ? `Hi ${memberName}, your society ${communityName} has been registered and is pending platform approval.`
          : `Hi ${memberName}, your request to join ${communityName} has been registered and is pending admin approval.`;

    const html =
      event === "approved"
        ? emailLayout(
            isCommunityRequest ? "Your society is approved" : "You're approved",
            `Hi ${safeName},<br/>${isCommunityRequest ? `Your society <strong>${safeCommunity}</strong> has been approved on Mohalla.` : `Your membership in <strong>${safeCommunity}</strong> has been approved.`}`,
            "Sign in to Mohalla",
            loginUrl,
          )
        : emailLayout(
            isCommunityRequest ? "Your society request is pending" : "Your approval request is pending",
            `Hi ${safeName},<br/>${isCommunityRequest ? `Your society <strong>${safeCommunity}</strong> has been registered and is pending platform approval.` : `Your request to join <strong>${safeCommunity}</strong> has been registered and is waiting for admin approval.`}`,
            "Open Mohalla",
            loginUrl,
          );

    await sendResendEmail({
      resendApiKey,
      from: emailFrom,
      to: typedTarget.email,
      subject,
      text,
      html,
    });
    sentTo.push(typedTarget.email);
  }

  if (event === "pending" && typedTarget.community_id) {
    const roles = isCommunityRequest
      ? await supabase.from("user_roles").select("user_id").eq("role", "super_admin")
      : await supabase.from("user_roles").select("user_id").in("role", ["admin", "moderator"]);
    const managerIds = [...new Set((roles.data ?? []).map((row: { user_id: string }) => row.user_id))].filter(
      (id) => id !== typedTarget.id,
    );

    if (managerIds.length > 0) {
      let managerQuery = supabase
        .from("profiles")
        .select("id, email, display_name, full_name, community_id")
        .in("id", managerIds)
        .not("email", "is", null);

      if (!isCommunityRequest) {
        managerQuery = managerQuery.eq("community_id", typedTarget.community_id);
      }

      const { data: managers } = await managerQuery;
      for (const manager of managers ?? []) {
        if (!manager.email) continue;
        const managerName = personName(manager as Profile);
        const subject = isCommunityRequest
          ? `New society request pending: ${communityName}`
          : `New resident request pending: ${memberName}`;
        const text = isCommunityRequest
          ? `${memberName} registered ${communityName} and is waiting for platform approval.`
          : `${memberName} registered and is waiting for approval in ${communityName}.`;
        const html = emailLayout(
          subject,
          `Hi ${escapeHtml(managerName)},<br/>${escapeHtml(text)}`,
          isCommunityRequest ? "Review societies" : "Review members",
          isCommunityRequest ? `${appUrl}/super-admin/communities` : `${appUrl}/admin/members`,
        );

        await sendResendEmail({
          resendApiKey,
          from: emailFrom,
          to: manager.email,
          subject,
          text,
          html,
        });
        sentTo.push(manager.email);
      }
    }
  }

  return json({ sent: sentTo.length > 0, count: sentTo.length });
});
