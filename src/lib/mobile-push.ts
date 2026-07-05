import { supabase } from "@/integrations/supabase/client";
import { getUser } from "@/lib/auth";

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

function base64UrlToUint8Array(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  if (!isStandaloneApp()) return "default";
  return Notification.requestPermission();
}

export async function syncMobilePushSubscription(registration: ServiceWorkerRegistration) {
  const user = getUser();
  if (!user || user.email === "demo@mohalla.app") return;
  if (!("PushManager" in window)) return;

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();
  if (!vapidPublicKey) return;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
    }));

  const serialized = subscription.toJSON();
  const p256dh = serialized.keys?.p256dh;
  const auth = serialized.keys?.auth;
  if (!serialized.endpoint || !p256dh || !auth) return;

  await (supabase as any).from("mobile_push_subscriptions").upsert(
    {
      user_id: user.userId,
      endpoint: serialized.endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
      is_enabled: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" },
  );
}
