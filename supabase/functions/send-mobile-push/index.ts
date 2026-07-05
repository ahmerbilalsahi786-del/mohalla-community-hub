import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

type PushKind = "event" | "safety_alert" | "announcement" | "message";

type Profile = {
  id: string;
  community_id: string | null;
  membership_status: string | null;
};

type Target = {
  id: string;
  notify_events?: boolean | null;
  notify_messages?: boolean | null;
  notify_safety?: boolean | null;
  notify_announcements?: boolean | null;
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

function cleanText(value: unknown, maxLength: number) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function preferenceEnabled(target: Target, kind: PushKind) {
  if (kind === "event") return target.notify_events ?? true;
  if (kind === "message") return target.notify_messages ?? true;
  if (kind === "safety_alert") return target.notify_safety ?? true;
  if (kind === "announcement") return target.notify_announcements ?? true;
  return true;
}

async function approvedCommunityTargets(
  supabase: ReturnType<typeof createClient>,
  communityId: string,
  excludeUserId: string,
  preferenceColumn: string,
) {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("community_id", communityId)
    .eq("membership_status", "approved")
    .neq("id", excludeUserId);
  if (error) throw error;
  const ids = (profiles ?? []).map((row: any) => row.id);
  if (ids.length === 0) return [];

  const { data: preferences, error: preferenceError } = await supabase
    .from("notification_preferences")
    .select(`user_id, ${preferenceColumn}`)
    .in("user_id", ids);
  if (preferenceError) throw preferenceError;

  const prefsByUserId = new Map((preferences ?? []).map((row: any) => [row.user_id, row]));
  return ids.map((id) => ({ id, ...(prefsByUserId.get(id) ?? {}) })) as Target[];
}

async function getScenario(input: {
  supabase: ReturnType<typeof createClient>;
  kind: PushKind;
  sourceId: string;
  actor: { id: string };
  actorProfile: Profile | null;
}) {
  const { supabase, kind, sourceId, actor, actorProfile } = input;

  if (kind === "event") {
    const { data: event, error } = await supabase.from("events").select("*").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!event) return null;
    if (event.user_id !== actor.id) return { error: "You cannot notify for this event.", status: 403 };
    const communityId = event.community_id ?? actorProfile?.community_id;
    if (!communityId) return { error: "Event community not found.", status: 409 };
    const targets = await approvedCommunityTargets(supabase, communityId, actor.id, "notify_events");
    return {
      targets,
      notification: {
        type: "event",
        title: "New community event",
        body: cleanText(event.title, 120),
        link: "/events",
      },
    };
  }

  if (kind === "safety_alert") {
    const { data: alert, error } = await supabase.from("safety_alerts").select("*").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!alert) return null;
    if (alert.user_id !== actor.id) return { error: "You cannot notify for this safety alert.", status: 403 };
    const communityId = alert.community_id ?? actorProfile?.community_id;
    if (!communityId) return { error: "Safety alert community not found.", status: 409 };
    const targets = await approvedCommunityTargets(supabase, communityId, actor.id, "notify_safety");
    return {
      targets,
      notification: {
        type: "safety_alert",
        title: "Safety alert",
        body: cleanText(alert.title, 120),
        link: "/safety",
      },
    };
  }

  if (kind === "announcement") {
    const { data: post, error } = await supabase.from("posts").select("*").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!post) return null;
    if (post.user_id !== actor.id || post.type !== "announcement") {
      return { error: "You cannot notify for this announcement.", status: 403 };
    }
    const communityId = post.community_id ?? actorProfile?.community_id;
    if (!communityId) return { error: "Announcement community not found.", status: 409 };
    const targets = await approvedCommunityTargets(supabase, communityId, actor.id, "notify_announcements");
    return {
      targets,
      notification: {
        type: "announcement",
        title: "Community announcement",
        body: cleanText(post.title, 120),
        link: "/feed",
      },
    };
  }

  const { data: message, error: messageError } = await supabase
    .from("conversation_messages")
    .select("*")
    .eq("id", sourceId)
    .maybeSingle();
  if (messageError) throw messageError;
  if (!message) return null;
  if (message.sender_id !== actor.id) return { error: "You cannot notify for this message.", status: 403 };

  const { data: conversation, error: conversationError } = await supabase
    .from("message_conversations")
    .select("*")
    .eq("id", message.conversation_id)
    .maybeSingle();
  if (conversationError) throw conversationError;
  if (!conversation) return null;

  const recipientId = conversation.participant_one === actor.id ? conversation.participant_two : conversation.participant_one;
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("notify_messages")
    .eq("user_id", recipientId)
    .maybeSingle();

  return {
    targets: [{ id: recipientId, notify_messages: prefs?.notify_messages ?? true }],
    notification: {
      type: "message",
      title: "New private message",
      body: cleanText(message.body, 120),
      link: `/messages/${conversation.id}`,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = serviceKey();
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@mohalla.app";

  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase function secrets are not configured." }, 500);
  if (!vapidPublicKey || !vapidPrivateKey) return json({ error: "Push secrets are not configured." }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization token." }, 401);

  let payload: { kind?: PushKind; sourceId?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const kind = payload.kind;
  const sourceId = payload.sourceId?.trim();
  if (!kind || !["event", "safety_alert", "announcement", "message"].includes(kind)) {
    return json({ error: "Invalid notification kind." }, 400);
  }
  if (!sourceId) return json({ error: "Missing source id." }, 400);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: actor },
    error: actorError,
  } = await supabase.auth.getUser(token);
  if (actorError || !actor) return json({ error: "Unauthorized." }, 401);

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("id, community_id, membership_status")
    .eq("id", actor.id)
    .maybeSingle();

  const scenario = await getScenario({
    supabase,
    kind,
    sourceId,
    actor,
    actorProfile: actorProfile as Profile | null,
  });

  if (!scenario) return json({ error: "Notification source not found." }, 404);
  if ("error" in scenario) return json({ error: scenario.error }, scenario.status);

  const targets = scenario.targets.filter((target) => target.id !== actor.id && preferenceEnabled(target, kind));
  if (targets.length === 0) return json({ sent: false, count: 0, reason: "No recipients." });

  const targetIds = [...new Set(targets.map((target) => target.id))];
  const notificationRows = targetIds.map((userId) => ({
    user_id: userId,
    type: scenario.notification.type,
    title: scenario.notification.title,
    body: scenario.notification.body,
    data: { link: scenario.notification.link },
  }));
  await supabase.from("notifications").insert(notificationRows);

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("mobile_push_subscriptions")
    .select("*")
    .in("user_id", targetIds)
    .eq("is_enabled", true);
  if (subscriptionError) throw subscriptionError;

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const pushPayload = JSON.stringify({
    title: scenario.notification.title,
    body: scenario.notification.body,
    url: scenario.notification.link,
    tag: `mohalla-${kind}-${sourceId}`,
  });

  let sent = 0;
  for (const subscription of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        pushPayload,
      );
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("mobile_push_subscriptions").update({ is_enabled: false }).eq("id", subscription.id);
      }
    }
  }

  return json({ sent: sent > 0, count: sent, recipients: targetIds.length });
});
