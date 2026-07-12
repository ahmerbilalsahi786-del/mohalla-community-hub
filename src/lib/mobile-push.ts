import { supabase } from "@/integrations/supabase/client";
import { getUser } from "@/lib/auth";

export type MobilePushStatus = "unsupported" | "missing-key" | "blocked" | "prompt" | "disabled" | "enabled";

export type MobilePushState = {
  status: MobilePushStatus;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function getVapidPublicKey() {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? "";
}

function currentPushUser() {
  const user = getUser();
  if (!user || user.email === "demo@mohalla.app") return null;
  return user;
}

function base64UrlToUint8Array(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function pushState(permission: MobilePushState["permission"], subscribed: boolean): MobilePushState {
  if (!isPushSupported()) return { status: "unsupported", permission: "unsupported", subscribed: false };
  if (!getVapidPublicKey()) return { status: "missing-key", permission, subscribed: false };
  if (permission === "denied") return { status: "blocked", permission, subscribed: false };
  if (permission === "default") return { status: "prompt", permission, subscribed: false };
  return { status: subscribed ? "enabled" : "disabled", permission, subscribed };
}

async function getRegistration(registration?: ServiceWorkerRegistration) {
  if (registration) return registration;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getMobilePushState(registration?: ServiceWorkerRegistration): Promise<MobilePushState> {
  if (!isPushSupported()) return { status: "unsupported", permission: "unsupported", subscribed: false };

  const existing = registration ?? (await navigator.serviceWorker.getRegistration());
  const subscription = await existing?.pushManager.getSubscription().catch(() => null);
  return pushState(Notification.permission, Boolean(subscription));
}

async function subscribeCurrentDevice(registration?: ServiceWorkerRegistration): Promise<MobilePushState> {
  const user = currentPushUser();
  if (!user) return getMobilePushState(registration);

  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) return pushState(Notification.permission, false);

  const activeRegistration = await getRegistration(registration);
  const existing = await activeRegistration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await activeRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
    }));

  const serialized = subscription.toJSON();
  const p256dh = serialized.keys?.p256dh;
  const auth = serialized.keys?.auth;
  if (!serialized.endpoint || !p256dh || !auth) return getMobilePushState(activeRegistration);

  const { error } = await (supabase as any).from("mobile_push_subscriptions").upsert(
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

  if (error) throw error;
  return getMobilePushState(activeRegistration);
}

export async function syncMobilePushSubscription(registration?: ServiceWorkerRegistration): Promise<MobilePushState> {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return getMobilePushState(registration);
  }

  return subscribeCurrentDevice(registration);
}

export async function enableMobilePushNotifications(): Promise<MobilePushState> {
  if (!isPushSupported()) return { status: "unsupported", permission: "unsupported", subscribed: false };
  if (!getVapidPublicKey()) return pushState(Notification.permission, false);
  if (Notification.permission === "denied") return pushState(Notification.permission, false);

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return pushState(permission, false);

  return subscribeCurrentDevice();
}

export async function disableMobilePushNotifications(): Promise<MobilePushState> {
  if (!isPushSupported()) return { status: "unsupported", permission: "unsupported", subscribed: false };

  const user = currentPushUser();
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  const endpoint = subscription?.endpoint;

  if (subscription) {
    await subscription.unsubscribe();
  }

  if (user && endpoint) {
    const { error } = await (supabase as any)
      .from("mobile_push_subscriptions")
      .update({
        is_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.userId)
      .eq("endpoint", endpoint);

    if (error) throw error;
  }

  return getMobilePushState(registration ?? undefined);
}
