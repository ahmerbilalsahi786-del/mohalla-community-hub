import { supabase } from "@/integrations/supabase/client";

type JsonBody = Record<string, any>;
const extendedDb = supabase as any;

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
const DEFAULT_PREFS = {
  notifyComments: true,
  notifyLikes: true,
  notifySafety: true,
  notifyEvents: true,
  notifyMessages: true,
  notifyAnnouncements: true,
  notifyMarketplace: true,
  notifyApprovals: true,
  notifyTexts: true,
};
const TOKEN_KEY = "mohalla_token";
const DEMO_USER_ID = "ahmed";
const DEMO_POSTS_KEY = "mohalla_demo_posts";
const DEMO_LISTINGS_KEY = "mohalla_demo_listings";
const DEMO_EVENTS_KEY = "mohalla_demo_events";
const DEMO_ALERTS_KEY = "mohalla_demo_alerts";
const DEMO_POLLS_KEY = "mohalla_demo_polls";
const DEMO_POST_COMMENTS_KEY = "mohalla_demo_post_comments";
const DEMO_ALERT_COMMENTS_KEY = "mohalla_demo_alert_comments";
const DEMO_RSVPS_KEY = "mohalla_demo_rsvps";
const DEMO_MEMBERS_KEY = "mohalla_demo_members";
const DEMO_COMMUNITY_KEY = "mohalla_demo_community";
const DEMO_PREFS_KEY = "mohalla_demo_notification_preferences";
const DEMO_CITY_PUBLICATIONS_KEY = "mohalla_demo_city_publications";
const DEMO_MESSAGE_CONVERSATIONS_KEY = "mohalla_demo_message_conversations";
const DEMO_CONVERSATION_MESSAGES_KEY = "mohalla_demo_conversation_messages";
const DEMO_MESSAGE_READS_KEY = "mohalla_demo_message_reads";

type MobilePushKind = "event" | "safety_alert" | "announcement" | "message";

function notifyInstalledApps(kind: MobilePushKind, sourceId: string) {
  supabase.functions
    .invoke("send-mobile-push", { body: { kind, sourceId } })
    .then(({ error }) => {
      if (error) console.warn("Mobile push notification failed", error.message);
    })
    .catch((error) => {
      console.warn("Mobile push notification failed", error);
    });
}

const DEMO_PROFILE = {
  id: DEMO_USER_ID,
  display_name: "Ahmed Khan",
  full_name: "Ahmed Khan",
  unit_number: "B-204",
  avatar_url: null,
  created_at: new Date().toISOString(),
};

let bridgeInstalled = false;

function apiUrl(url: string) {
  return new URL(url, window.location.origin);
}

function isApiRequest(input: RequestInfo | URL) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith("/api/")) return true;
  if (typeof window === "undefined") return false;
  return url.startsWith(`${window.location.origin}/api/`);
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseBody(body: BodyInit | null | undefined): JsonBody {
  if (!body || typeof body !== "string") return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function decodeTokenPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload || typeof window === "undefined") return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function isDemoMode() {
  if (typeof window === "undefined") return false;
  const payload = decodeTokenPayload(window.localStorage.getItem(TOKEN_KEY) ?? "");
  return payload?.typ === "demo";
}

function readDemoPosts() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DEMO_POSTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoPosts(posts: JsonBody[]) {
  writeDemoRows(DEMO_POSTS_KEY, posts, 20);
}

function readDemoRows(key: string) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoRows(key: string, rows: JsonBody[], limit = 20) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(rows.slice(0, limit)));
  } catch {
    throw new Error("Your browser storage is full. Try posting with a smaller image.");
  }
}

function readDemoMap(key: string): Record<string, JsonBody[]> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeDemoMap(key: string, value: Record<string, JsonBody[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readDemoObject(key: string, fallback: JsonBody = {}) {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeDemoObject(key: string, value: JsonBody) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function defaultDemoMembers() {
  return [
    {
      id: "ahmed",
      communityId: "default",
      userId: "ahmed",
      name: "Ahmed Khan",
      unitNumber: "B-204",
      phone: "+92 300 1111111",
      status: "approved",
      role: "admin",
      isVerified: true,
      joinDate: DEMO_PROFILE.created_at,
    },
    {
      id: "fatima",
      communityId: "default",
      userId: "fatima",
      name: "Fatima Ali",
      unitNumber: "A-102",
      phone: "+92 300 2222222",
      status: "pending",
      role: "user",
      isVerified: false,
      joinDate: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "bilal",
      communityId: "default",
      userId: "bilal",
      name: "Bilal Raza",
      unitNumber: "C-301",
      phone: "+92 300 3333333",
      status: "approved",
      role: "moderator",
      isVerified: true,
      joinDate: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}

function readDemoMembers() {
  const saved = readDemoRows(DEMO_MEMBERS_KEY);
  return saved.length > 0 ? saved : defaultDemoMembers();
}

function writeDemoMembers(members: JsonBody[]) {
  writeDemoRows(DEMO_MEMBERS_KEY, members, 100);
}

function getDemoCommunity() {
  if (typeof window === "undefined") {
    return {
      id: id("demo-community"),
      communityId: "default",
      name: "Mohalla Community Hub",
      area: "Gulberg",
      city: "Lahore",
      latitude: 31.5204,
      longitude: 74.3587,
      logoUrl: null,
      status: "approved",
      themePrimaryColor: "#1B5E20",
      themeSecondaryColor: "#0288D1",
      themeBackgroundColor: "#FAFDF8",
      themeBannerColor: "#FFFFFF",
      themeSidebarColor: "#FFFFFF",
      rules: "Be respectful. Keep posts relevant. Use safety alerts responsibly.",
    };
  }

  const saved = window.localStorage.getItem(DEMO_COMMUNITY_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      window.localStorage.removeItem(DEMO_COMMUNITY_KEY);
    }
  }

  return {
    id: id("demo-community"),
    communityId: "default",
    name: "Mohalla Community Hub",
    area: "Gulberg",
    city: "Lahore",
    latitude: 31.5204,
    longitude: 74.3587,
    logoUrl: null,
    status: "approved",
    themePrimaryColor: "#1B5E20",
    themeSecondaryColor: "#0288D1",
    themeBackgroundColor: "#FAFDF8",
    themeBannerColor: "#FFFFFF",
    themeSidebarColor: "#FFFFFF",
    rules: "Be respectful. Keep posts relevant. Use safety alerts responsibly.",
  };
}

function writeDemoCommunity(payload: JsonBody) {
  const next = { ...getDemoCommunity(), ...payload, communityId: "default" };
  window.localStorage.setItem(DEMO_COMMUNITY_KEY, JSON.stringify(next));
  return next;
}

function cityKey(value?: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function compactText(value?: unknown, maxLength = 260) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function sourceType(value?: unknown) {
  const next = String(value ?? "").trim();
  const allowed = new Set(["post", "event", "listing", "poll", "safety_alert", "place", "volunteer"]);
  if (!allowed.has(next)) throw new Error("Unsupported city feed item type.");
  return next;
}

function textFromError(error: unknown) {
  if (!error || typeof error !== "object") return String(error ?? "");
  const record = error as Record<string, unknown>;
  return [record.code, record.message, record.details, record.hint]
    .filter(Boolean)
    .map(String)
    .join(" ")
    .toLowerCase();
}

function isCityPublicationStoreError(error: unknown) {
  const text = textFromError(error);
  return (
    text.includes("42p01") ||
    text.includes("pgrst205") ||
    text.includes("pgrst106") ||
    text.includes("does not exist") ||
    text.includes("could not find the table") ||
    text.includes("could not find the function") ||
    (text.includes("schema cache") && (text.includes("city_publications") || text.includes("my_community_city_key")))
  );
}

function cityPublicationStoreSetupError() {
  return new Error("City Feed database setup is not available yet. Please run the latest Supabase migrations, then try again.");
}

function defaultDemoCityPublications() {
  const now = new Date().toISOString();
  const city = getDemoCommunity().city || "Lahore";
  return [
    {
      id: "demo-city-publication-1",
      community_id: "demo-park-view",
      city,
      source_type: "event",
      source_id: "demo-neighbor-event",
      title: "Family night market at Park View",
      summary: "Food stalls, kids games, and a small craft bazaar open to nearby families this Friday evening.",
      image_url: null,
      href: "/city-feed",
      author_id: null,
      author_name: "Park View Admin",
      community_name: "Park View Society",
      community_area: "Gulberg",
      latitude: 31.5268,
      longitude: 74.3529,
      published_by: null,
      published_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      is_active: true,
      metadata: { date: now.slice(0, 10), location: "Central Park" },
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-city-publication-2",
      community_id: "demo-garden-estate",
      city,
      source_type: "post",
      source_id: "demo-neighbor-post",
      title: "New recycling pickup schedule",
      summary: "Garden Estate is moving recyclable pickup to Sunday mornings and sharing their vendor contact with nearby societies.",
      image_url: null,
      href: "/city-feed",
      author_id: null,
      author_name: "Garden Estate Admin",
      community_name: "Garden Estate",
      community_area: "Model Town",
      latitude: 31.4806,
      longitude: 74.3239,
      published_by: null,
      published_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      is_active: true,
      metadata: { postType: "announcement" },
      created_at: now,
      updated_at: now,
    },
  ];
}

function readDemoCityPublications() {
  const saved = readDemoRows(DEMO_CITY_PUBLICATIONS_KEY);
  return saved.length > 0 ? saved : defaultDemoCityPublications();
}

function writeDemoCityPublications(rows: JsonBody[]) {
  writeDemoRows(DEMO_CITY_PUBLICATIONS_KEY, rows, 100);
}

async function currentUserId() {
  if (isDemoMode()) return DEMO_USER_ID;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? DEFAULT_USER_ID;
}

async function requiredUserId() {
  const userId = await currentUserId();
  if (userId === DEFAULT_USER_ID) {
    throw new Error("Please sign in before saving community content.");
  }
  return userId;
}

async function canManageCommunity() {
  if (isDemoMode()) return true;
  await requiredUserId();
  const { data, error } = await (supabase as any).rpc("can_manage_own_community");
  if (error) throw error;
  return data === true;
}

async function currentCommunityId() {
  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("community_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.community_id) throw new Error("No community is linked to this account.");
  return data.community_id as string;
}

async function requireCommunityManager() {
  if (!(await canManageCommunity())) {
    throw new Error("Administrator access required.");
  }
  return currentCommunityId();
}

async function currentCommunityContext(managerOnly = false) {
  if (isDemoMode()) {
    const community = getDemoCommunity();
    return {
      id: String(community.id ?? "default"),
      name: community.name ?? "Mohalla Community Hub",
      area: community.area ?? "",
      city: community.city || "Lahore",
      latitude: community.latitude ?? null,
      longitude: community.longitude ?? null,
    };
  }

  const communityId = managerOnly ? await requireCommunityManager() : await currentCommunityId();
  const { data, error } = await extendedDb.from("community_settings").select("*").eq("id", communityId).maybeSingle();
  if (error) throw error;
  const communityRow = data as JsonBody | null;
  const city = compactText(communityRow?.welcome_message, 80);
  if (!city) throw new Error("Add a city to your community settings before using City Feed.");
  return {
    id: communityId,
    name: communityRow?.name ?? "Mohalla Community",
    area: communityRow?.description ?? "",
    city,
    latitude: communityRow?.latitude ?? null,
    longitude: communityRow?.longitude ?? null,
  };
}

async function resolveRequestedUserId(value?: string | null) {
  if (!value || value === "me" || value === "ahmed" || value === "default") return currentUserId();
  return value;
}

function id(value: string) {
  return value as unknown as number;
}

function profileName(profile?: any) {
  return profile?.display_name ?? profile?.full_name ?? "Resident";
}

function unit(profile?: any) {
  return profile?.unit_number ?? "";
}

function asRowId(value: number | string) {
  return String(value);
}

function toComment(row: any, profile?: any) {
  return {
    id: id(row.id),
    postId: id(row.post_id),
    userId: row.user_id,
    userName: profileName(profile),
    unitNumber: unit(profile),
    body: row.body,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toAlertComment(row: any, profile?: any) {
  return {
    id: id(row.id),
    alertId: id(row.alert_id),
    userId: row.user_id,
    userName: profileName(profile),
    unitNumber: unit(profile),
    body: row.body,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

async function profilesById(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, any>();

  const { data } = await supabase.from("profiles").select("*").in("id", uniqueIds);
  return new Map((data ?? []).map((profile: any) => [profile.id, profile]));
}

function applySearch<T extends JsonBody>(rows: T[], search: string | null, keys: string[]) {
  if (!search) return rows;
  const needle = search.toLowerCase();
  return rows.filter((row) => keys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle)));
}

function pageRows<T>(rows: T[], page: number, limit: number) {
  const start = Math.max(0, (page - 1) * limit);
  return rows.slice(start, start + limit);
}

function toPost(row: any, profile?: any) {
  return {
    id: id(row.id),
    communityId: "default",
    userId: row.user_id,
    userName: profileName(profile),
    unitNumber: unit(profile),
    type: row.type ?? "general",
    title: row.title,
    body: row.body,
    imageUrls: row.image_urls ?? [],
    isPinned: Boolean(row.is_pinned),
    likesCount: row.likes_count ?? 0,
    commentsCount: row.comments_count ?? 0,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function createDemoPost(payload: JsonBody) {
  const now = new Date().toISOString();
  const row = {
    id: `demo-${Date.now()}`,
    user_id: DEMO_USER_ID,
    type: payload.type ?? "general",
    title: payload.title,
    body: payload.body,
    image_urls: Array.isArray(payload.imageUrls) ? payload.imageUrls : [],
    is_pinned: Boolean(payload.isPinned),
    likes_count: 0,
    comments_count: 0,
    created_at: now,
    updated_at: now,
  };

  writeDemoPosts([row, ...readDemoPosts()]);
  return toPost(row, DEMO_PROFILE);
}

function createDemoListing(payload: JsonBody) {
  const now = new Date().toISOString();
  const row = {
    id: `demo-listing-${Date.now()}`,
    user_id: DEMO_USER_ID,
    title: payload.title,
    description: payload.description,
    price_pkr: payload.pricePkr ?? null,
    category: payload.category ?? "other",
    condition: payload.condition ?? "good",
    image_urls: Array.isArray(payload.imageUrls) ? payload.imageUrls : [],
    status: "available",
    whatsapp_number: payload.whatsappNumber ?? "",
    listing_kind: payload.listingKind ?? "listing",
    location: payload.location ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    created_at: now,
    updated_at: now,
  };

  writeDemoRows(DEMO_LISTINGS_KEY, [row, ...readDemoRows(DEMO_LISTINGS_KEY)], 40);
  return toListing(row, DEMO_PROFILE);
}

function createDemoEvent(payload: JsonBody) {
  const now = new Date().toISOString();
  const row = {
    id: `demo-event-${Date.now()}`,
    user_id: DEMO_USER_ID,
    title: payload.title,
    description: payload.description ?? "",
    event_date: payload.date,
    event_time: payload.time ?? "",
    location: payload.location ?? "",
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    image_url: payload.imageUrl ?? null,
    rsvp_count: 0,
    created_at: now,
    updated_at: now,
  };

  writeDemoRows(DEMO_EVENTS_KEY, [row, ...readDemoRows(DEMO_EVENTS_KEY)], 40);
  return toEvent(row, DEMO_PROFILE);
}

function createDemoAlert(payload: JsonBody) {
  const now = new Date().toISOString();
  const row = {
    id: `demo-alert-${Date.now()}`,
    user_id: DEMO_USER_ID,
    alert_type: payload.type ?? "general",
    title: payload.title,
    description: payload.description,
    location: payload.locationDetail ?? "",
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    severity: payload.severity ?? "medium",
    is_resolved: false,
    created_at: now,
    updated_at: now,
  };

  writeDemoRows(DEMO_ALERTS_KEY, [row, ...readDemoRows(DEMO_ALERTS_KEY)], 40);
  return toAlert(row, DEMO_PROFILE);
}

function createDemoPoll(payload: JsonBody) {
  const now = new Date().toISOString();
  const options = Array.isArray(payload.options) ? payload.options.filter(Boolean) : [];
  const row = {
    id: id(`demo-poll-${Date.now()}`),
    communityId: "default",
    userId: DEMO_USER_ID,
    userName: profileName(DEMO_PROFILE),
    unitNumber: unit(DEMO_PROFILE),
    question: payload.question,
    options,
    endsAt: payload.endsAt ?? new Date(Date.now() + 86400000).toISOString(),
    createdAt: now,
    totalVotes: 0,
    voteCounts: options.map(() => 0),
    myVoteIndex: null,
    isEnded: false,
  };

  writeDemoRows(DEMO_POLLS_KEY, [row, ...readDemoRows(DEMO_POLLS_KEY)], 30);
  return row;
}

function toListing(row: any, profile?: any) {
  return {
    id: id(row.id),
    communityId: "default",
    userId: row.user_id,
    userName: profileName(profile),
    unitNumber: unit(profile),
    title: row.title,
    description: row.description,
    pricePkr: row.price_pkr,
    category: row.category ?? "other",
    imageUrls: row.image_urls ?? [],
    condition: row.condition ?? "good",
    status: row.status ?? "available",
    whatsappNumber: row.whatsapp_number ?? "",
    listingKind: row.listing_kind ?? (row.category === "shop" ? "shop" : "listing"),
    location: row.location ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toEvent(row: any, profile?: any, myStatus: string | null = null) {
  return {
    id: id(row.id),
    communityId: "default",
    userId: row.user_id,
    userName: profileName(profile),
    unitNumber: unit(profile),
    title: row.title,
    description: row.description ?? "",
    date: row.event_date,
    time: row.event_time ?? "",
    location: row.location ?? "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    imageUrl: row.image_url,
    rsvpCount: row.rsvp_count ?? 0,
    myStatus,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toAlert(row: any, profile?: any) {
  return {
    id: id(row.id),
    communityId: "default",
    userId: row.user_id,
    userName: profileName(profile),
    unitNumber: unit(profile),
    type: row.alert_type ?? "general",
    title: row.title,
    description: row.description,
    locationDetail: row.location ?? "",
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    imageUrl: null,
    severity: row.severity ?? "medium",
    isResolved: Boolean(row.is_resolved),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toCityPublication(row: any) {
  return {
    id: id(row.id),
    communityId: row.community_id ?? "default",
    city: row.city,
    sourceType: row.source_type,
    sourceId: row.source_id,
    title: row.title,
    summary: row.summary ?? "",
    imageUrl: row.image_url ?? null,
    href: row.href ?? "",
    authorId: row.author_id ?? null,
    authorName: row.author_name ?? "Resident",
    communityName: row.community_name ?? "Mohalla Community",
    communityArea: row.community_area ?? "",
    latitude: row.latitude ?? row.metadata?.latitude ?? null,
    longitude: row.longitude ?? row.metadata?.longitude ?? null,
    publishedBy: row.published_by ?? null,
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
    isActive: Boolean(row.is_active),
    metadata: row.metadata ?? {},
  };
}

function emptyCityPublicationList(page: number, limit: number, city: string, communities: any[] = []) {
  return {
    items: [],
    total: 0,
    page,
    limit,
    hasMore: false,
    city,
    communities,
  };
}

function assertSameCommunity(row: any, communityId: string) {
  if (row?.community_id && String(row.community_id) !== String(communityId)) {
    throw new Error("You can only publish items from your own community.");
  }
}

async function sourceAuthor(userId?: string | null) {
  if (!userId) return { authorId: null, authorName: "Resident" };
  if (isDemoMode()) return { authorId: DEMO_USER_ID, authorName: profileName(DEMO_PROFILE) };
  const profiles = await profilesById([userId]);
  return { authorId: userId, authorName: profileName(profiles.get(userId)) };
}

async function buildDemoPublicationSnapshot(kind: string, sourceId: string) {
  if (kind === "post") {
    const row = readDemoPosts().find((item: any) => String(item.id) === sourceId);
    if (!row) throw new Error("Post not found.");
    return {
      sourceType: "post",
      sourceId,
      title: compactText(row.title, 120),
      summary: compactText(row.body),
      imageUrl: row.image_urls?.[0] ?? null,
      href: "/feed",
      authorId: DEMO_USER_ID,
      authorName: profileName(DEMO_PROFILE),
      metadata: { postType: row.type ?? "general" },
    };
  }

  if (kind === "event") {
    const row = readDemoRows(DEMO_EVENTS_KEY).find((item: any) => String(item.id) === sourceId);
    if (!row) throw new Error("Event not found.");
    return {
      sourceType: "event",
      sourceId,
      title: compactText(row.title, 120),
      summary: compactText(row.description),
      imageUrl: row.image_url ?? null,
      href: "/events",
      authorId: DEMO_USER_ID,
      authorName: profileName(DEMO_PROFILE),
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      metadata: { date: row.event_date, time: row.event_time, location: row.location, latitude: row.latitude ?? null, longitude: row.longitude ?? null },
    };
  }

  if (kind === "listing") {
    const row = readDemoRows(DEMO_LISTINGS_KEY).find((item: any) => String(item.id) === sourceId);
    if (!row) throw new Error("Listing not found.");
    return {
      sourceType: "listing",
      sourceId,
      title: compactText(row.title, 120),
      summary: compactText(row.description),
      imageUrl: row.image_urls?.[0] ?? null,
      href: `/marketplace/${sourceId}`,
      authorId: DEMO_USER_ID,
      authorName: profileName(DEMO_PROFILE),
      metadata: { category: row.category, pricePkr: row.price_pkr, status: row.status },
    };
  }

  if (kind === "poll") {
    const row = readDemoRows(DEMO_POLLS_KEY).find((item: any) => String(item.id) === sourceId);
    if (!row) throw new Error("Poll not found.");
    return {
      sourceType: "poll",
      sourceId,
      title: compactText(row.question, 120),
      summary: compactText((row.options ?? []).join(" · ")),
      imageUrl: null,
      href: "/polls",
      authorId: DEMO_USER_ID,
      authorName: profileName(DEMO_PROFILE),
      metadata: { options: row.options ?? [], endsAt: row.endsAt },
    };
  }

  if (kind === "safety_alert") {
    const row = readDemoRows(DEMO_ALERTS_KEY).find((item: any) => String(item.id) === sourceId);
    if (!row) throw new Error("Safety alert not found.");
    return {
      sourceType: "safety_alert",
      sourceId,
      title: compactText(row.title, 120),
      summary: compactText(row.description),
      imageUrl: row.image_url ?? null,
      href: "/safety",
      authorId: DEMO_USER_ID,
      authorName: profileName(DEMO_PROFILE),
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      metadata: { severity: row.severity, location: row.location, alertType: row.alert_type, latitude: row.latitude ?? null, longitude: row.longitude ?? null },
    };
  }

  throw new Error("Unsupported city feed item type.");
}

async function buildRemotePublicationSnapshot(kind: string, sourceId: string, communityId: string) {
  if (kind === "post") {
    const { data, error } = await extendedDb.from("posts").select("*").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Post not found.");
    assertSameCommunity(data, communityId);
    const author = await sourceAuthor(data.user_id);
    return {
      sourceType: "post",
      sourceId,
      title: compactText(data.title, 120),
      summary: compactText(data.body),
      imageUrl: data.image_urls?.[0] ?? null,
      href: "/feed",
      ...author,
      metadata: { postType: data.type ?? "general" },
    };
  }

  if (kind === "event") {
    const { data, error } = await extendedDb.from("events").select("*").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Event not found.");
    assertSameCommunity(data, communityId);
    const author = await sourceAuthor(data.user_id);
    return {
      sourceType: "event",
      sourceId,
      title: compactText(data.title, 120),
      summary: compactText(data.description),
      imageUrl: data.image_url ?? null,
      href: "/events",
      ...author,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      metadata: { date: data.event_date, time: data.event_time, location: data.location, latitude: data.latitude ?? null, longitude: data.longitude ?? null },
    };
  }

  if (kind === "listing") {
    const { data, error } = await extendedDb.from("listings").select("*").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Listing not found.");
    assertSameCommunity(data, communityId);
    const author = await sourceAuthor(data.user_id);
    return {
      sourceType: "listing",
      sourceId,
      title: compactText(data.title, 120),
      summary: compactText(data.description),
      imageUrl: data.image_urls?.[0] ?? null,
      href: `/marketplace/${sourceId}`,
      ...author,
      metadata: { category: data.category, pricePkr: data.price_pkr, status: data.status },
    };
  }

  if (kind === "poll") {
    const { data, error } = await extendedDb.from("polls").select("*, poll_options(option_text)").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Poll not found.");
    assertSameCommunity(data, communityId);
    const options = (data.poll_options ?? []).map((option: any) => option.option_text).filter(Boolean);
    const author = await sourceAuthor(data.user_id);
    return {
      sourceType: "poll",
      sourceId,
      title: compactText(data.question, 120),
      summary: compactText(options.join(" · ")),
      imageUrl: null,
      href: "/polls",
      ...author,
      metadata: { options, endsAt: data.ends_at },
    };
  }

  if (kind === "safety_alert") {
    const { data, error } = await extendedDb.from("safety_alerts").select("*").eq("id", sourceId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Safety alert not found.");
    assertSameCommunity(data, communityId);
    const author = await sourceAuthor(data.user_id);
    return {
      sourceType: "safety_alert",
      sourceId,
      title: compactText(data.title, 120),
      summary: compactText(data.description),
      imageUrl: null,
      href: "/safety",
      ...author,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      metadata: { severity: data.severity, location: data.location, alertType: data.alert_type, latitude: data.latitude ?? null, longitude: data.longitude ?? null },
    };
  }

  throw new Error("Unsupported city feed item type.");
}

async function listFeed(params: URLSearchParams) {
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const search = params.get("search");
  const category = params.get("category");
  if (isDemoMode()) {
    let rows = applySearch(readDemoPosts(), search, ["title", "body", "type"]);
    if (category && category !== "all") rows = rows.filter((row: any) => row.type === category);
    const posts = pageRows(rows, page, limit).map((row: any) => toPost(row, DEMO_PROFILE));
    return { posts, total: rows.length, page, limit, hasMore: page * limit < rows.length };
  }

  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const userId = await requiredUserId();
  const { data: blockedRows, error: blockedError } = await extendedDb
    .from("user_blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  if (blockedError) throw blockedError;
  const blockedIds = new Set((blockedRows ?? []).map((row: any) => row.blocked_id));
  let rows = applySearch((data ?? []).filter((row: any) => !blockedIds.has(row.user_id)), search, ["title", "body", "type"]);
  if (category && category !== "all") {
    rows = rows.filter((row: any) => row.type === category);
  }

  const profiles = await profilesById(rows.map((row: any) => row.user_id));
  const posts = pageRows(rows, page, limit).map((row: any) => toPost(row, profiles.get(row.user_id)));
  return { posts, total: rows.length, page, limit, hasMore: page * limit < rows.length };
}

async function listListings(params: URLSearchParams) {
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const search = params.get("search");
  const category = params.get("category");
  const sellerId = params.get("sellerId");
  const minPrice = Number(params.get("minPrice") ?? 0);
  const maxPrice = Number(params.get("maxPrice") ?? 0);
  if (isDemoMode()) {
    let rows = applySearch(readDemoRows(DEMO_LISTINGS_KEY), search, ["title", "description", "category", "location"]);
    if (category === "shop") rows = rows.filter((row: any) => row.category === "shop" || row.listing_kind === "shop");
    else rows = rows.filter((row: any) => row.category !== "shop" && row.listing_kind !== "shop");
    if (category && category !== "all" && category !== "shop") rows = rows.filter((row: any) => row.category === category);
    if (sellerId) rows = rows.filter((row: any) => String(row.user_id) === sellerId);
    if (minPrice) rows = rows.filter((row: any) => Number(row.price_pkr ?? 0) >= minPrice);
    if (maxPrice) rows = rows.filter((row: any) => Number(row.price_pkr ?? 0) <= maxPrice);
    const listings = pageRows(rows, page, limit).map((row: any) => toListing(row, DEMO_PROFILE));
    return { listings, total: rows.length, page, limit, hasMore: page * limit < rows.length };
  }

  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  let rows = applySearch(data ?? [], search, ["title", "description", "category", "location"]);
  if (category === "shop") rows = rows.filter((row: any) => row.category === "shop" || row.listing_kind === "shop");
  else rows = rows.filter((row: any) => row.category !== "shop" && row.listing_kind !== "shop");
  if (category && category !== "all" && category !== "shop") rows = rows.filter((row: any) => row.category === category);
  if (sellerId) rows = rows.filter((row: any) => String(row.user_id) === sellerId);
  if (minPrice) rows = rows.filter((row: any) => Number(row.price_pkr ?? 0) >= minPrice);
  if (maxPrice) rows = rows.filter((row: any) => Number(row.price_pkr ?? 0) <= maxPrice);
  const profiles = await profilesById(rows.map((row: any) => row.user_id));
  const listings = pageRows(rows, page, limit).map((row: any) => toListing(row, profiles.get(row.user_id)));
  return { listings, total: rows.length, page, limit, hasMore: page * limit < rows.length };
}

async function listEvents() {
  if (isDemoMode()) {
    const rows = readDemoRows(DEMO_EVENTS_KEY);
    const today = new Date().toISOString().slice(0, 10);
    const rsvps = readDemoRows(DEMO_RSVPS_KEY);
    const events = rows.map((row: any) => {
      const myStatus = rsvps.find((rsvp: any) => String(rsvp.event_id) === String(row.id) && rsvp.user_id === DEMO_USER_ID)?.status ?? null;
      return toEvent(row, DEMO_PROFILE, myStatus);
    });
    return {
      upcoming: events.filter((event) => event.date >= today),
      past: events.filter((event) => event.date < today),
    };
  }

  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const profiles = await profilesById(rows.map((row: any) => row.user_id));
  const userId = await requiredUserId();
  const { data: myRsvps, error: rsvpError } = await supabase
    .from("event_rsvps")
    .select("event_id, status")
    .eq("user_id", userId);
  if (rsvpError) throw rsvpError;
  const myStatusByEvent = new Map((myRsvps ?? []).map((rsvp: any) => [rsvp.event_id, rsvp.status]));
  const today = new Date().toISOString().slice(0, 10);
  const events = rows.map((row: any) => toEvent(row, profiles.get(row.user_id), myStatusByEvent.get(row.id) ?? null));
  return {
    upcoming: events.filter((event) => event.date >= today),
    past: events.filter((event) => event.date < today),
  };
}

async function listPolls() {
  if (isDemoMode()) {
    const now = Date.now();
    const demoPolls = readDemoRows(DEMO_POLLS_KEY).map((poll: any) => ({
      ...poll,
      isEnded: new Date(poll.endsAt).getTime() < now,
    }));
    return {
      active: demoPolls.filter((poll) => !poll.isEnded),
      ended: demoPolls.filter((poll) => poll.isEnded),
    };
  }

  const { data, error } = await supabase.from("polls").select("*, poll_options(*)").order("created_at", { ascending: false });
  if (error) throw error;

  const remoteRows = data ?? [];
  const profiles = await profilesById(remoteRows.map((row: any) => row.user_id));
  const now = Date.now();
  const optionIds = remoteRows.flatMap((row: any) => (row.poll_options ?? []).map((option: any) => option.id));
  const votesByOption = new Map<string, number>();
  const myVotesByPoll = new Map<string, string>();
  const userId = await currentUserId();
  if (optionIds.length > 0) {
    const { data: votes } = await supabase.from("poll_votes").select("*").in("option_id", optionIds);
    for (const vote of votes ?? []) {
      votesByOption.set(vote.option_id, (votesByOption.get(vote.option_id) ?? 0) + 1);
      if (vote.user_id === userId) myVotesByPoll.set(vote.poll_id, vote.option_id);
    }
  }
  const polls = remoteRows.map((row: any) => {
    const options = row.poll_options ?? [];
    const endsAt = row.ends_at ?? new Date(Date.now() + 86400000).toISOString();
    const voteCounts = options.map((option: any) => votesByOption.get(option.id) ?? option.votes_count ?? 0);
    const myVoteOptionId = myVotesByPoll.get(row.id);
    return {
      id: id(row.id),
      communityId: "default",
      userId: row.user_id,
      userName: profileName(profiles.get(row.user_id)),
      unitNumber: unit(profiles.get(row.user_id)),
      question: row.question,
      options: options.map((option: any) => option.option_text),
      endsAt,
      createdAt: row.created_at ?? new Date().toISOString(),
      totalVotes: voteCounts.reduce((sum: number, count: number) => sum + count, 0),
      voteCounts,
      myVoteIndex: myVoteOptionId ? options.findIndex((option: any) => option.id === myVoteOptionId) : null,
      isEnded: !row.is_active || new Date(endsAt).getTime() < now,
    };
  });
  return {
    active: polls.filter((poll) => !poll.isEnded),
    ended: polls.filter((poll) => poll.isEnded),
  };
}

async function listSafety(params: URLSearchParams) {
  const resolved = params.get("resolved");
  if (isDemoMode()) {
    let rows = readDemoRows(DEMO_ALERTS_KEY);
    if (resolved === "true") rows = rows.filter((row: any) => Boolean(row.is_resolved));
    if (resolved === "false") rows = rows.filter((row: any) => !Boolean(row.is_resolved));
    return rows.map((row: any) => toAlert(row, DEMO_PROFILE));
  }

  let query = supabase.from("safety_alerts").select("*").order("created_at", { ascending: false });
  if (resolved === "true") query = query.eq("is_resolved", true);
  if (resolved === "false") query = query.eq("is_resolved", false);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const profiles = await profilesById(rows.map((row: any) => row.user_id));
  return rows.map((row: any) => toAlert(row, profiles.get(row.user_id)));
}

function hasUsablePoint(row: any) {
  return Number.isFinite(Number(row?.latitude)) && Number.isFinite(Number(row?.longitude));
}

function toCityCommunity(row: any) {
  return {
    id: String(row.id),
    name: row.name ?? "Mohalla Community",
    area: row.description ?? row.area ?? "",
    city: row.welcome_message ?? row.city ?? "",
    logoUrl: row.logo_url ?? row.logoUrl ?? null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

async function listCityMapCommunities(city: string) {
  if (isDemoMode()) {
    const own = getDemoCommunity();
    return [
      toCityCommunity(own),
      toCityCommunity({
        id: "demo-park-view",
        name: "Park View Society",
        description: "Gulberg",
        welcome_message: own.city || "Lahore",
        logo_url: null,
        latitude: 31.5268,
        longitude: 74.3529,
      }),
      toCityCommunity({
        id: "demo-garden-estate",
        name: "Garden Estate",
        description: "Model Town",
        welcome_message: own.city || "Lahore",
        logo_url: null,
        latitude: 31.4806,
        longitude: 74.3239,
      }),
    ].filter((row) => cityKey(row.city) === cityKey(city) && hasUsablePoint(row));
  }

  const { data, error } = await extendedDb
    .from("community_settings")
    .select("id, name, description, welcome_message, logo_url, latitude, longitude")
    .eq("status", "approved")
    .ilike("welcome_message", city)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(200);
  if (error) {
    console.warn("City map communities unavailable", error);
    return [];
  }
  return (data ?? []).filter(hasUsablePoint).map(toCityCommunity);
}

async function listCityPublications(params: URLSearchParams) {
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const search = params.get("search");
  const kind = params.get("sourceType");
  let community;
  try {
    community = await currentCommunityContext(false);
  } catch (error) {
    console.warn("City feed community context unavailable", error);
    return emptyCityPublicationList(page, limit, "your city");
  }

  if (isDemoMode()) {
    let rows = readDemoCityPublications().filter(
      (row: any) => row.is_active !== false && cityKey(row.city) === cityKey(community.city),
    );
    if (kind && kind !== "all") rows = rows.filter((row: any) => row.source_type === kind);
    rows = applySearch(rows, search, ["title", "summary", "community_name", "source_type"]);
    const communities = await listCityMapCommunities(community.city);
    return {
      items: pageRows(rows, page, limit).map(toCityPublication),
      total: rows.length,
      page,
      limit,
      hasMore: page * limit < rows.length,
      city: community.city,
      communities,
    };
  }

  const communities = await listCityMapCommunities(community.city);
  let query = extendedDb
    .from("city_publications")
    .select("*")
    .eq("is_active", true)
    .ilike("city", community.city)
    .order("published_at", { ascending: false })
    .limit(200);

  if (kind && kind !== "all") query = query.eq("source_type", kind);

  const { data, error } = await query;
  if (error) {
    console.warn("City feed publications unavailable", error);
    return emptyCityPublicationList(page, limit, community.city, communities);
  }

  const rows = applySearch(data ?? [], search, ["title", "summary", "community_name", "source_type"]);
  return {
    items: pageRows(rows, page, limit).map(toCityPublication),
    total: rows.length,
    page,
    limit,
    hasMore: page * limit < rows.length,
    city: community.city,
    communities,
  };
}

async function getCityPublicationStatus(params: URLSearchParams) {
  const kind = sourceType(params.get("sourceType"));
  const sourceId = String(params.get("sourceId") ?? "").trim();
  if (!sourceId) throw new Error("City feed source id is required.");
  let community;
  try {
    community = await currentCommunityContext(false);
  } catch (error) {
    console.warn("City feed status unavailable", error);
    return { isPublic: false, publication: null };
  }

  if (isDemoMode()) {
    const row = readDemoCityPublications().find(
      (item: any) =>
        item.source_type === kind &&
        String(item.source_id) === sourceId &&
        cityKey(item.city) === cityKey(community.city) &&
        item.is_active !== false,
    );
    return { isPublic: Boolean(row), publication: row ? toCityPublication(row) : null };
  }

  const { data, error } = await extendedDb
    .from("city_publications")
    .select("*")
    .eq("community_id", community.id)
    .eq("source_type", kind)
    .eq("source_id", sourceId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.warn("City feed status unavailable", error);
    return { isPublic: false, publication: null };
  }
  return { isPublic: Boolean(data), publication: data ? toCityPublication(data) : null };
}

async function publishCityPublication(payload: JsonBody) {
  const kind = sourceType(payload.sourceType);
  const sourceId = String(payload.sourceId ?? "").trim();
  if (!sourceId) throw new Error("City feed source id is required.");
  const community = await currentCommunityContext(true);
  const now = new Date().toISOString();

  if (isDemoMode()) {
    const snapshot = await buildDemoPublicationSnapshot(kind, sourceId);
    const snapshotPoint = snapshot as JsonBody;
    const rows = readDemoCityPublications();
    const existing = rows.find((row: any) => row.source_type === kind && String(row.source_id) === sourceId && row.community_id === community.id);
    const row = {
      id: existing?.id ?? `demo-city-publication-${Date.now()}`,
      community_id: community.id,
      city: community.city,
      source_type: snapshot.sourceType,
      source_id: snapshot.sourceId,
      title: snapshot.title,
      summary: snapshot.summary,
      image_url: snapshot.imageUrl,
      href: snapshot.href,
      author_id: snapshot.authorId,
      author_name: snapshot.authorName,
      community_name: community.name,
      community_area: community.area,
      latitude: snapshotPoint.latitude ?? null,
      longitude: snapshotPoint.longitude ?? null,
      published_by: DEMO_USER_ID,
      published_at: now,
      is_active: true,
      metadata: snapshot.metadata,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    writeDemoCityPublications([row, ...rows.filter((item: any) => item.id !== row.id)]);
    return toCityPublication(row);
  }

  const snapshot = await buildRemotePublicationSnapshot(kind, sourceId, community.id);
  const snapshotPoint = snapshot as JsonBody;
  const userId = await requiredUserId();
  const row = {
    community_id: community.id,
    city: community.city,
    source_type: snapshot.sourceType,
    source_id: snapshot.sourceId,
    title: snapshot.title,
    summary: snapshot.summary,
    image_url: snapshot.imageUrl,
    href: snapshot.href,
    author_id: snapshot.authorId,
    author_name: snapshot.authorName,
    community_name: community.name,
    community_area: community.area,
    latitude: snapshotPoint.latitude ?? null,
    longitude: snapshotPoint.longitude ?? null,
    published_by: userId,
    published_at: now,
    is_active: true,
    metadata: snapshot.metadata,
    updated_at: now,
  };

  const existing = await extendedDb
    .from("city_publications")
    .select("id")
    .eq("community_id", community.id)
    .eq("source_type", snapshot.sourceType)
    .eq("source_id", snapshot.sourceId)
    .maybeSingle();
  if (existing.error) {
    if (isCityPublicationStoreError(existing.error)) throw cityPublicationStoreSetupError();
    throw existing.error;
  }

  const result = existing.data
    ? await extendedDb.from("city_publications").update(row).eq("id", existing.data.id).select("*").single()
    : await extendedDb.from("city_publications").insert(row).select("*").single();
  const { data, error } = result;
  if (error) {
    if (isCityPublicationStoreError(error)) throw cityPublicationStoreSetupError();
    throw error;
  }
  return toCityPublication(data);
}

async function unpublishCityPublication(payload: JsonBody) {
  const kind = sourceType(payload.sourceType);
  const sourceId = String(payload.sourceId ?? "").trim();
  if (!sourceId) throw new Error("City feed source id is required.");
  const community = await currentCommunityContext(true);

  if (isDemoMode()) {
    const rows = readDemoCityPublications();
    const next = rows.map((row: any) =>
      row.source_type === kind && String(row.source_id) === sourceId && row.community_id === community.id
        ? { ...row, is_active: false, updated_at: new Date().toISOString() }
        : row,
    );
    writeDemoCityPublications(next);
    return { ok: true };
  }

  const { error } = await extendedDb
    .from("city_publications")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("community_id", community.id)
    .eq("source_type", kind)
    .eq("source_id", sourceId);
  if (error) {
    if (isCityPublicationStoreError(error)) throw cityPublicationStoreSetupError();
    throw error;
  }
  return { ok: true };
}

async function getPost(postId: string) {
  const demoPost = isDemoMode() ? readDemoPosts().find((row: any) => String(row.id) === postId) : null;
  if (demoPost) return toPost(demoPost, DEMO_PROFILE);

  const { data, error } = await supabase.from("posts").select("*").eq("id", postId).single();
  if (error) throw error;
  const profiles = await profilesById([data.user_id]);
  const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
    supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", postId),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", postId),
  ]);
  return toPost({ ...data, likes_count: likesCount ?? data.likes_count, comments_count: commentsCount ?? data.comments_count }, profiles.get(data.user_id));
}

async function createPost(payload: JsonBody) {
  if (isDemoMode()) return createDemoPost(payload);

  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      type: payload.type ?? "general",
      title: payload.title,
      body: payload.body,
      image_urls: payload.imageUrls ?? [],
      is_pinned: Boolean(payload.isPinned),
    })
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([userId]);
  return toPost(data, profiles.get(userId));
}

async function toggleLike(postId: string) {
  if (isDemoMode()) {
    const posts = readDemoPosts();
    const index = posts.findIndex((row: any) => String(row.id) === postId);
    if (index === -1) throw new Error("Post not found.");
    const row = { ...posts[index] };
    row.likes_count = row.likes_count > 0 ? 0 : 1;
    posts[index] = row;
    writeDemoPosts(posts);
    return toPost(row, DEMO_PROFILE);
  }

  const userId = await requiredUserId();
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("post_likes").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }

  return getPost(postId);
}

async function listComments(postId: string) {
  if (isDemoMode()) {
    const comments = readDemoMap(DEMO_POST_COMMENTS_KEY)[postId] ?? [];
    return comments.map((row: any) => toComment(row, DEMO_PROFILE));
  }

  const { data, error } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (error) throw error;
  const profiles = await profilesById((data ?? []).map((row: any) => row.user_id));
  return (data ?? []).map((row: any) => toComment(row, profiles.get(row.user_id)));
}

async function createComment(postId: string, payload: JsonBody) {
  if (isDemoMode()) {
    const map = readDemoMap(DEMO_POST_COMMENTS_KEY);
    const row = {
      id: `demo-comment-${Date.now()}`,
      post_id: postId,
      user_id: DEMO_USER_ID,
      body: payload.body,
      created_at: new Date().toISOString(),
    };
    map[postId] = [...(map[postId] ?? []), row];
    writeDemoMap(DEMO_POST_COMMENTS_KEY, map);

    const posts = readDemoPosts();
    const index = posts.findIndex((post: any) => String(post.id) === postId);
    if (index >= 0) {
      posts[index] = { ...posts[index], comments_count: map[postId].length };
      writeDemoPosts(posts);
    }

    return toComment(row, DEMO_PROFILE);
  }

  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, body: payload.body })
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([userId]);
  return toComment(data, profiles.get(userId));
}

async function createListing(payload: JsonBody) {
  if (isDemoMode()) return createDemoListing(payload);

  const userId = await requiredUserId();
  const communityId = await currentCommunityId();
  const { data, error } = await extendedDb
    .from("listings")
    .insert({
      user_id: userId,
      community_id: communityId,
      title: payload.title,
      description: payload.description,
      price_pkr: payload.pricePkr ?? null,
      category: payload.category ?? "other",
      condition: payload.condition ?? "good",
      image_urls: payload.imageUrls ?? [],
      whatsapp_number: payload.whatsappNumber ?? null,
      listing_kind: payload.listingKind ?? "listing",
      location: payload.location ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([userId]);
  return toListing(data, profiles.get(userId));
}

async function getListingById(listingId: string) {
  const demoListing = isDemoMode() ? readDemoRows(DEMO_LISTINGS_KEY).find((row: any) => String(row.id) === listingId) : null;
  if (demoListing) return toListing(demoListing, DEMO_PROFILE);

  const { data, error } = await supabase.from("listings").select("*").eq("id", listingId).single();
  if (error) throw error;
  const profiles = await profilesById([data.user_id]);
  return toListing(data, profiles.get(data.user_id));
}

async function updateListingStatus(listingId: string, payload: JsonBody) {
  const status = payload.status ?? "available";
  if (isDemoMode()) {
    const rows = readDemoRows(DEMO_LISTINGS_KEY);
    const index = rows.findIndex((row: any) => String(row.id) === listingId);
    if (index === -1) throw new Error("Listing not found.");
    rows[index] = { ...rows[index], status, updated_at: new Date().toISOString() };
    writeDemoRows(DEMO_LISTINGS_KEY, rows, 40);
    return toListing(rows[index], DEMO_PROFILE);
  }

  const { data, error } = await supabase
    .from("listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([data.user_id]);
  return toListing(data, profiles.get(data.user_id));
}

async function deleteListing(listingId: string) {
  if (isDemoMode()) {
    const rows = readDemoRows(DEMO_LISTINGS_KEY);
    const next = rows.filter((row: any) => String(row.id) !== listingId);
    if (next.length === rows.length) throw new Error("Listing not found.");
    writeDemoRows(DEMO_LISTINGS_KEY, next, 40);
    return { ok: true };
  }

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) throw error;
  return { ok: true };
}

async function createEvent(payload: JsonBody) {
  if (isDemoMode()) return createDemoEvent(payload);

  const userId = await requiredUserId();
  const { data, error } = await (supabase as any)
    .from("events")
    .insert({
      user_id: userId,
      title: payload.title,
      description: payload.description ?? "",
      event_date: payload.date,
      event_time: payload.time ?? null,
      location: payload.location ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      image_url: payload.imageUrl ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  notifyInstalledApps("event", String(data.id));
  const profiles = await profilesById([userId]);
  return toEvent(data, profiles.get(userId));
}

async function rsvpEvent(eventId: string, payload: JsonBody) {
  const status = payload.status ?? "going";
  if (isDemoMode()) {
    const rsvps = readDemoRows(DEMO_RSVPS_KEY).filter((row: any) => !(String(row.event_id) === eventId && row.user_id === DEMO_USER_ID));
    const row = {
      id: `demo-rsvp-${Date.now()}`,
      event_id: eventId,
      user_id: DEMO_USER_ID,
      status,
      created_at: new Date().toISOString(),
    };
    writeDemoRows(DEMO_RSVPS_KEY, [row, ...rsvps], 100);

    const events = readDemoRows(DEMO_EVENTS_KEY);
    const index = events.findIndex((event: any) => String(event.id) === eventId);
    if (index >= 0) {
      events[index] = { ...events[index], rsvp_count: rsvps.filter((item: any) => String(item.event_id) === eventId).length + 1 };
      writeDemoRows(DEMO_EVENTS_KEY, events, 40);
    }

    return { id: id(row.id), eventId: id(eventId), userId: DEMO_USER_ID, userName: profileName(DEMO_PROFILE), status, createdAt: row.created_at };
  }

  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: "event_id,user_id" })
    .select("*")
    .single();
  if (error) throw error;

  return {
    id: id(data.id),
    eventId: id(data.event_id),
    userId: data.user_id,
    userName: "Resident",
    status: data.status,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}

async function createSafetyAlert(payload: JsonBody) {
  if (isDemoMode()) return createDemoAlert(payload);

  const userId = await requiredUserId();
  const communityId = await currentCommunityId();
  const { data, error } = await extendedDb
    .from("safety_alerts")
    .insert({
      user_id: userId,
      community_id: communityId,
      alert_type: payload.type ?? "general",
      title: payload.title,
      description: payload.description,
      location: payload.locationDetail ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      severity: payload.severity ?? "medium",
    })
    .select("*")
    .single();
  if (error) throw error;
  notifyInstalledApps("safety_alert", String(data.id));
  const profiles = await profilesById([userId]);
  return toAlert(data, profiles.get(userId));
}

async function resolveAlert(alertId: string) {
  if (isDemoMode()) {
    const rows = readDemoRows(DEMO_ALERTS_KEY);
    const index = rows.findIndex((row: any) => String(row.id) === alertId);
    if (index === -1) throw new Error("Alert not found.");
    rows[index] = { ...rows[index], is_resolved: true, updated_at: new Date().toISOString() };
    writeDemoRows(DEMO_ALERTS_KEY, rows, 40);
    return toAlert(rows[index], DEMO_PROFILE);
  }

  const { data, error } = await supabase
    .from("safety_alerts")
    .update({ is_resolved: true, updated_at: new Date().toISOString() })
    .eq("id", alertId)
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([data.user_id]);
  return toAlert(data, profiles.get(data.user_id));
}

async function listAlertComments(alertId: string) {
  if (isDemoMode()) {
    const comments = readDemoMap(DEMO_ALERT_COMMENTS_KEY)[alertId] ?? [];
    return comments.map((row: any) => toAlertComment(row, DEMO_PROFILE));
  }

  const { data, error } = await supabase.from("alert_comments").select("*").eq("alert_id", alertId).order("created_at", { ascending: true });
  if (error) throw error;
  const profiles = await profilesById((data ?? []).map((row: any) => row.user_id));
  return (data ?? []).map((row: any) => toAlertComment(row, profiles.get(row.user_id)));
}

async function createAlertComment(alertId: string, payload: JsonBody) {
  if (isDemoMode()) {
    const map = readDemoMap(DEMO_ALERT_COMMENTS_KEY);
    const row = {
      id: `demo-alert-comment-${Date.now()}`,
      alert_id: alertId,
      user_id: DEMO_USER_ID,
      body: payload.body,
      created_at: new Date().toISOString(),
    };
    map[alertId] = [...(map[alertId] ?? []), row];
    writeDemoMap(DEMO_ALERT_COMMENTS_KEY, map);
    return toAlertComment(row, DEMO_PROFILE);
  }

  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("alert_comments")
    .insert({ alert_id: alertId, user_id: userId, body: payload.body })
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([userId]);
  return toAlertComment(data, profiles.get(userId));
}

async function createPoll(payload: JsonBody) {
  if (isDemoMode()) {
    createDemoPoll(payload);
    return listPolls();
  }

  const userId = await requiredUserId();
  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      user_id: userId,
      question: payload.question,
      ends_at: payload.endsAt,
    })
    .select("*")
    .single();
  if (error) throw error;

  const options = Array.isArray(payload.options) ? payload.options : [];
  if (options.length > 0) {
    const { error: optionError } = await supabase
      .from("poll_options")
      .insert(options.map((option: string) => ({ poll_id: poll.id, option_text: option })));
    if (optionError) throw optionError;
  }

  return listPolls();
}

async function votePoll(pollId: string, payload: JsonBody) {
  const optionIndex = Number(payload.optionIndex ?? 0);
  if (isDemoMode()) {
    const polls = readDemoRows(DEMO_POLLS_KEY);
    const index = polls.findIndex((poll: any) => String(poll.id) === pollId);
    if (index === -1) throw new Error("Poll not found.");
    const poll = { ...polls[index] };
    const previousVote = typeof poll.myVoteIndex === "number" ? poll.myVoteIndex : null;
    const voteCounts = [...(poll.voteCounts ?? poll.options.map(() => 0))];
    if (previousVote !== null && voteCounts[previousVote] > 0) voteCounts[previousVote] -= 1;
    voteCounts[optionIndex] = (voteCounts[optionIndex] ?? 0) + 1;
    polls[index] = {
      ...poll,
      myVoteIndex: optionIndex,
      voteCounts,
      totalVotes: voteCounts.reduce((sum: number, count: number) => sum + count, 0),
    };
    writeDemoRows(DEMO_POLLS_KEY, polls, 30);
    return polls[index];
  }

  const userId = await requiredUserId();
  const { data: options, error: optionError } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: true });
  if (optionError) throw optionError;
  const selected = options?.[optionIndex];
  if (!selected) throw new Error("Poll option not found.");

  const { error } = await supabase
    .from("poll_votes")
    .upsert({ poll_id: pollId, option_id: selected.id, user_id: userId }, { onConflict: "poll_id,user_id" });
  if (error) throw error;

  const lists = await listPolls();
  return [...lists.active, ...lists.ended].find((poll) => String(poll.id) === pollId) ?? lists.active[0] ?? lists.ended[0];
}

async function saveProfile(userIdParam: string, payload: JsonBody) {
  const userId = await resolveRequestedUserId(userIdParam);
  if (isDemoMode() && userId === DEMO_USER_ID) {
    return {
      userId,
      displayName: payload.displayName ?? profileName(DEMO_PROFILE),
      unitNumber: payload.unitNumber ?? unit(DEMO_PROFILE),
      avatarUrl: payload.avatarUrl ?? null,
      whatsappNumber: payload.whatsappNumber ?? null,
      showUnit: payload.showUnit ?? true,
      showPhone: payload.showPhone ?? true,
      showActivity: payload.showActivity ?? true,
      receiveTexts: payload.receiveTexts ?? true,
      createdAt: DEMO_PROFILE.created_at,
    };
  }

  const current = await requiredUserId();
  if (userId !== current) throw new Error("You can only update your own profile.");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: payload.displayName,
      unit_number: payload.unitNumber,
      avatar_url: payload.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;

  await extendedDb
    .from("private_profiles")
    .upsert({
      id: userId,
      whatsapp_number: payload.whatsappNumber,
      show_unit: payload.showUnit ?? true,
      show_phone: payload.showPhone ?? true,
      show_activity: payload.showActivity ?? true,
      receive_texts: payload.receiveTexts ?? true,
      updated_at: new Date().toISOString(),
    });

  return {
    userId,
    displayName: profileName(data),
    unitNumber: unit(data),
    avatarUrl: data.avatar_url,
    whatsappNumber: payload.whatsappNumber ?? null,
    showUnit: payload.showUnit ?? true,
    showPhone: payload.showPhone ?? true,
    showActivity: payload.showActivity ?? true,
    receiveTexts: payload.receiveTexts ?? true,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}

function toMember(profile: any, manager: boolean) {
  return {
    id: id(profile.id),
    communityId: profile.community_id ?? "default",
    userId: profile.id,
    name: profileName(profile),
    unitNumber: unit(profile),
    phone: manager ? profile.private_profiles?.phone ?? profile.private_profiles?.whatsapp_number ?? "" : "",
    whatsappNumber: manager ? profile.private_profiles?.whatsapp_number ?? "" : "",
    status: profile.membership_status ?? (profile.is_verified ? "approved" : "pending"),
    role: profile.user_roles?.[0]?.role ?? "user",
    isVerified: Boolean(profile.is_verified),
    joinDate: profile.created_at ?? new Date().toISOString(),
  };
}

async function listAdminMembers(params: URLSearchParams) {
  if (isDemoMode()) {
    const status = params.get("status");
    const rows = readDemoMembers();
    return status && status !== "all" ? rows.filter((member: any) => member.status === status) : rows;
  }

  const limit = Number(params.get("limit") ?? 100);
  const communityId = await requireCommunityManager();
  let query = extendedDb
    .from("profiles")
    .select("*")
    .eq("community_id", communityId)
    .limit(limit);
  const status = params.get("status");
  if (status && status !== "all") query = query.eq("membership_status", status);
  const { data, error } = await query;
  if (error) throw error;

  const profiles = data ?? [];
  const profileIds = profiles.map((profile: any) => profile.id).filter(Boolean);
  if (!profileIds.length) return [];

  const [{ data: privateProfiles, error: privateError }, { data: userRoles, error: roleError }] = await Promise.all([
    extendedDb
      .from("private_profiles")
      .select("*")
      .in("id", profileIds),
    extendedDb
      .from("user_roles")
      .select("*")
      .in("user_id", profileIds),
  ]);

  if (privateError) {
    console.warn("Private member details could not be loaded:", privateError);
  }
  if (roleError) {
    console.warn("Member roles could not be loaded:", roleError);
  }

  const privateProfilesById = new Map((privateProfiles ?? []).map((row: any) => [row.id, row]));
  const rolePriority: Record<string, number> = { super_admin: 0, admin: 1, moderator: 2, user: 3 };
  const rolesByUserId = new Map<string, any[]>();
  for (const row of userRoles ?? []) {
    const rows = rolesByUserId.get(row.user_id) ?? [];
    rows.push(row);
    rows.sort((a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99));
    rolesByUserId.set(row.user_id, rows);
  }

  return profiles.map((profile: any) => toMember({
    ...profile,
    private_profiles: privateProfilesById.get(profile.id) ?? null,
    user_roles: rolesByUserId.get(profile.id) ?? [],
  }, true));
}

async function listCommunityMembers(params: URLSearchParams) {
  if (isDemoMode()) {
    const search = compactText(params.get("search"), 80).toLowerCase();
    const members = readDemoMembers().filter((member: any) => member.status === "approved");
    if (!search) return members;
    return members.filter((member: any) => {
      return [member.name, member.unitNumber, member.role]
        .some((value) => String(value ?? "").toLowerCase().includes(search));
    });
  }

  const limit = Number(params.get("limit") ?? 100);
  const communityId = await currentCommunityId();
  const status = params.get("status");
  const search = compactText(params.get("search"), 80);
  let query = extendedDb
    .from("profiles")
    .select("id, display_name, full_name, unit_number, membership_status, is_verified, created_at, community_id")
    .eq("community_id", communityId)
    .limit(limit);

  if (status && status !== "all") query = query.eq("membership_status", status);
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "\\$&")}%`;
    query = query.or(`display_name.ilike.${pattern},full_name.ilike.${pattern},unit_number.ilike.${pattern}`);
  }

  const { data, error } = await query
    .order("display_name", { ascending: true, nullsFirst: false })
    .order("full_name", { ascending: true, nullsFirst: false });
  if (error) throw error;

  const members = (data ?? []).map((profile: any) => toMember(profile, false));
  return status && status !== "all" ? members.filter((member: any) => member.status === status) : members;
}

async function listSocietyReviewers(params: URLSearchParams) {
  if (isDemoMode()) return [];

  const search = compactText(params.get("search"), 80) || null;
  const { data, error } = await extendedDb.rpc("list_society_reviewers", { search_text: search });
  if (error) throw error;

  return (data ?? []).map((reviewer: any) => ({
    userId: reviewer.user_id,
    name: reviewer.display_name || reviewer.full_name || "Community reviewer",
    unitNumber: reviewer.unit_number ?? "",
    avatarUrl: reviewer.avatar_url ?? null,
    role: reviewer.role,
    communityId: reviewer.community_id,
    communityName: reviewer.community_name || "Mohalla society",
    communityLogoUrl: reviewer.community_logo_url ?? null,
  }));
}

function demoMemberProfile(userId: string) {
  if (userId === DEMO_USER_ID) return { ...DEMO_PROFILE, community_id: "default", membership_status: "approved" };
  const member = readDemoMembers().find((row: any) => String(row.userId) === userId || String(row.id) === userId);
  if (!member) return null;
  return {
    id: member.userId ?? member.id,
    display_name: member.name,
    full_name: member.name,
    unit_number: member.unitNumber ?? "",
    avatar_url: null,
    community_id: member.communityId ?? "default",
    membership_status: member.status ?? "approved",
  };
}

function messageParticipant(profile?: any) {
  return {
    userId: profile?.id ?? "",
    name: profileName(profile),
    unitNumber: unit(profile),
    avatarUrl: profile?.avatar_url ?? null,
  };
}

function conversationPair(userId: string, otherUserId: string) {
  return [userId, otherUserId].sort();
}

function toConversation(row: any, currentUserIdValue: string, profile?: any, messages: any[] = [], readAt?: string | null) {
  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const lastMessage = sortedMessages[sortedMessages.length - 1] ?? null;
  const readTime = readAt ? new Date(readAt).getTime() : 0;
  const unreadCount = sortedMessages.filter((message) => {
    return message.sender_id !== currentUserIdValue && new Date(message.created_at).getTime() > readTime;
  }).length;

  return {
    id: String(row.id),
    participant: messageParticipant(profile),
    postId: row.post_id ?? null,
    postTitle: row.post_title ?? null,
    lastMessage: lastMessage?.body ?? null,
    lastMessageAt: lastMessage?.created_at ?? row.updated_at ?? row.created_at,
    unreadCount,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toConversationMessage(row: any, currentUserIdValue: string, profile?: any) {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    senderId: row.sender_id,
    senderName: profileName(profile),
    body: row.body,
    createdAt: row.created_at ?? new Date().toISOString(),
    isMine: row.sender_id === currentUserIdValue,
  };
}

function readDemoConversationMessages() {
  return readDemoRows(DEMO_CONVERSATION_MESSAGES_KEY);
}

function writeDemoConversationMessages(rows: JsonBody[]) {
  writeDemoRows(DEMO_CONVERSATION_MESSAGES_KEY, rows, 500);
}

function readDemoMessageReads() {
  return readDemoObject(DEMO_MESSAGE_READS_KEY, {});
}

function writeDemoMessageReads(value: JsonBody) {
  writeDemoObject(DEMO_MESSAGE_READS_KEY, value);
}

function demoConversationDetail(row: any) {
  const current = DEMO_USER_ID;
  const otherId = row.participant_one === current ? row.participant_two : row.participant_one;
  const otherProfile = demoMemberProfile(otherId) ?? { id: otherId, display_name: "Resident", unit_number: "" };
  const profiles = new Map([
    [DEMO_USER_ID, DEMO_PROFILE],
    [otherId, otherProfile],
  ]);
  const messages = readDemoConversationMessages()
    .filter((message: any) => String(message.conversation_id) === String(row.id))
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const reads = readDemoMessageReads();
  return {
    conversation: toConversation(row, current, otherProfile, messages, reads[row.id]),
    messages: messages.map((message: any) => toConversationMessage(message, current, profiles.get(message.sender_id))),
  };
}

async function listMessageConversations() {
  if (isDemoMode()) {
    const conversations = readDemoRows(DEMO_MESSAGE_CONVERSATIONS_KEY)
      .filter((row: any) => row.participant_one === DEMO_USER_ID || row.participant_two === DEMO_USER_ID)
      .map((row: any) => demoConversationDetail(row).conversation)
      .sort((a: any, b: any) => new Date(b.lastMessageAt ?? b.createdAt).getTime() - new Date(a.lastMessageAt ?? a.createdAt).getTime());
    return { conversations };
  }

  const userId = await requiredUserId();
  const { data, error } = await extendedDb
    .from("message_conversations")
    .select("*")
    .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const conversationIds = rows.map((row: any) => row.id);
  const otherIds = rows.map((row: any) => row.participant_one === userId ? row.participant_two : row.participant_one);
  const [profiles, messagesResult, readsResult] = await Promise.all([
    profilesById(otherIds),
    conversationIds.length
      ? extendedDb.from("conversation_messages").select("*").in("conversation_id", conversationIds).order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    conversationIds.length
      ? extendedDb.from("message_reads").select("*").eq("user_id", userId).in("conversation_id", conversationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (messagesResult.error) throw messagesResult.error;
  if (readsResult.error) throw readsResult.error;

  const messagesByConversation = new Map<string, any[]>();
  (messagesResult.data ?? []).forEach((message: any) => {
    const key = String(message.conversation_id);
    messagesByConversation.set(key, [...(messagesByConversation.get(key) ?? []), message]);
  });
  const readsByConversation = new Map<string, string | null>(
    (readsResult.data ?? []).map((row: any) => [String(row.conversation_id), row.last_read_at ?? null]),
  );
  const conversations = rows
    .map((row: any) => {
      const otherId = row.participant_one === userId ? row.participant_two : row.participant_one;
      return toConversation(row, userId, profiles.get(otherId), messagesByConversation.get(String(row.id)) ?? [], readsByConversation.get(String(row.id)));
    })
    .sort((a: any, b: any) => new Date(b.lastMessageAt ?? b.createdAt).getTime() - new Date(a.lastMessageAt ?? a.createdAt).getTime());

  return { conversations };
}

async function getMessageConversation(conversationId: string) {
  if (isDemoMode()) {
    const row = readDemoRows(DEMO_MESSAGE_CONVERSATIONS_KEY).find((conversation: any) => String(conversation.id) === conversationId);
    if (!row) throw new Error("Conversation not found.");
    return demoConversationDetail(row);
  }

  const userId = await requiredUserId();
  const { data: conversation, error } = await extendedDb.from("message_conversations").select("*").eq("id", conversationId).maybeSingle();
  if (error) throw error;
  if (!conversation) throw new Error("Conversation not found.");
  const otherId = conversation.participant_one === userId ? conversation.participant_two : conversation.participant_one;
  const { data: messages, error: messagesError } = await extendedDb
    .from("conversation_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (messagesError) throw messagesError;
  const { data: readRow, error: readError } = await extendedDb
    .from("message_reads")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;
  const profiles = await profilesById([otherId, ...(messages ?? []).map((message: any) => message.sender_id)]);

  return {
    conversation: toConversation(conversation, userId, profiles.get(otherId), messages ?? [], readRow?.last_read_at),
    messages: (messages ?? []).map((message: any) => toConversationMessage(message, userId, profiles.get(message.sender_id))),
  };
}

async function markConversationRead(conversationId: string) {
  if (isDemoMode()) {
    const reads = readDemoMessageReads();
    reads[conversationId] = new Date().toISOString();
    writeDemoMessageReads(reads);
    return { ok: true };
  }

  const userId = await requiredUserId();
  const { error } = await extendedDb
    .from("message_reads")
    .upsert(
      { conversation_id: conversationId, user_id: userId, last_read_at: new Date().toISOString() },
      { onConflict: "conversation_id,user_id" },
    );
  if (error) throw error;
  return { ok: true };
}

async function sendMessage(conversationId: string, payload: JsonBody) {
  const body = compactText(payload.body, 2000);
  if (!body) throw new Error("Message cannot be empty.");

  if (isDemoMode()) {
    const row = {
      id: `demo-message-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: DEMO_USER_ID,
      body,
      created_at: new Date().toISOString(),
    };
    writeDemoConversationMessages([...readDemoConversationMessages(), row]);
    const conversations = readDemoRows(DEMO_MESSAGE_CONVERSATIONS_KEY).map((conversation: any) =>
      String(conversation.id) === conversationId ? { ...conversation, updated_at: row.created_at } : conversation,
    );
    writeDemoRows(DEMO_MESSAGE_CONVERSATIONS_KEY, conversations, 100);
    return toConversationMessage(row, DEMO_USER_ID, DEMO_PROFILE);
  }

  const userId = await requiredUserId();
  const { data, error } = await extendedDb
    .from("conversation_messages")
    .insert({ conversation_id: conversationId, sender_id: userId, body })
    .select("*")
    .single();
  if (error) throw error;
  await extendedDb.from("message_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  notifyInstalledApps("message", String(data.id));
  const profiles = await profilesById([userId]);
  return toConversationMessage(data, userId, profiles.get(userId));
}

async function startConversation(payload: JsonBody) {
  const recipientId = String(payload.recipientId ?? "").trim();
  if (!recipientId) throw new Error("Choose a member to message.");

  if (isDemoMode()) {
    if (recipientId === DEMO_USER_ID) throw new Error("You cannot message yourself.");
    const recipient = demoMemberProfile(recipientId);
    if (!recipient) throw new Error("Member not found.");
    const [participantOne, participantTwo] = conversationPair(DEMO_USER_ID, recipientId);
    const rows = readDemoRows(DEMO_MESSAGE_CONVERSATIONS_KEY);
    let conversation = rows.find(
      (row: any) =>
        row.participant_one === participantOne &&
        row.participant_two === participantTwo,
    );
    if (!conversation) {
      const now = new Date().toISOString();
      conversation = {
        id: `demo-conversation-${Date.now()}`,
        community_id: "default",
        created_by: DEMO_USER_ID,
        participant_one: participantOne,
        participant_two: participantTwo,
        post_id: null,
        post_title: null,
        created_at: now,
        updated_at: now,
      };
      writeDemoRows(DEMO_MESSAGE_CONVERSATIONS_KEY, [conversation, ...rows], 100);
    }
    if (payload.openingMessage?.trim()) await sendMessage(String(conversation.id), { body: payload.openingMessage });
    return demoConversationDetail(conversation);
  }

  const userId = await requiredUserId();
  if (recipientId === userId) throw new Error("You cannot message yourself.");
  const communityId = await currentCommunityId();
  const { data: canStart, error: permissionError } = await extendedDb
    .rpc("can_start_message_with", { target_user: recipientId });
  if (permissionError) throw permissionError;
  if (!canStart) throw new Error("This member is not available for private messages.");

  const { data: recipient, error: recipientError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", recipientId)
    .eq("membership_status", "approved")
    .maybeSingle();
  if (recipientError) throw recipientError;
  if (!recipient) throw new Error("This member is not available for private messages.");

  const postId = payload.postId ? String(payload.postId) : null;
  if (postId) {
    const { data: post, error: postError } = await extendedDb.from("posts").select("id, title, community_id").eq("id", postId).maybeSingle();
    if (postError) throw postError;
    if (!post || post.community_id !== communityId) throw new Error("Post not found in your community.");
  }

  const [participantOne, participantTwo] = conversationPair(userId, recipientId);
  const query = extendedDb
    .from("message_conversations")
    .select("*")
    .eq("participant_one", participantOne)
    .eq("participant_two", participantTwo);
  const { data: existing, error: existingError } = await query.maybeSingle();
  if (existingError) throw existingError;

  let conversation = existing;
  if (!conversation) {
    const { data, error } = await extendedDb
      .from("message_conversations")
      .insert({
        community_id: communityId,
        created_by: userId,
        participant_one: participantOne,
        participant_two: participantTwo,
        post_id: null,
        post_title: null,
      })
      .select("*")
      .single();
    if (error) throw error;
    conversation = data;
  }

  if (payload.openingMessage?.trim()) await sendMessage(String(conversation.id), { body: payload.openingMessage });
  return getMessageConversation(String(conversation.id));
}

async function createMember(payload: JsonBody) {
  if (isDemoMode()) {
    const row = {
      id: payload.userId || `demo-member-${Date.now()}`,
      communityId: "default",
      userId: payload.userId || `demo-member-${Date.now()}`,
      name: payload.name,
      unitNumber: payload.unitNumber,
      phone: payload.phone ?? "",
      status: "pending",
      role: payload.role ?? "user",
      isVerified: false,
      joinDate: new Date().toISOString(),
    };
    writeDemoMembers([row, ...readDemoMembers()]);
    return row;
  }

  throw new Error("Members create their own accounts from the registration page.");
}

async function updateDemoMember(memberId: string, patch: JsonBody) {
  const rows = readDemoMembers();
  const index = rows.findIndex((member: any) => String(member.id) === memberId || String(member.userId) === memberId);
  if (index === -1) throw new Error("Member not found.");
  rows[index] = { ...rows[index], ...patch };
  writeDemoMembers(rows);
  return rows[index];
}

async function updateMember(memberId: string, action: string, payload: JsonBody = {}) {
  if (isDemoMode()) {
    if (action === "delete") {
      writeDemoMembers(readDemoMembers().filter((member: any) => String(member.id) !== memberId && String(member.userId) !== memberId));
      return { ok: true };
    }
    if (action === "approve") return updateDemoMember(memberId, { status: "approved", isVerified: true });
    if (action === "reject") return updateDemoMember(memberId, { status: "rejected", isVerified: false });
    if (action === "verify") return updateDemoMember(memberId, { isVerified: true, status: "approved" });
    if (action === "role") return updateDemoMember(memberId, { role: payload.role ?? "user" });
  }

  const requestedAction = action === "delete" ? "remove" : action;
  const { error } = await (supabase as any).rpc("admin_manage_member", {
    target_user: memberId,
    requested_action: requestedAction,
    requested_role: action === "role" ? payload.role ?? "user" : null,
  });
  if (error) throw error;
  if (action === "delete") return { ok: true };

  const members = await listAdminMembers(new URLSearchParams());
  return members.find((member: any) => String(member.userId) === memberId || String(member.id) === memberId) ?? members[0];
}

async function listAdminPosts(params: URLSearchParams) {
  const category = params.get("category");
  const result = await listFeed(params);
  return result.posts.filter((post) => !category || category === "all" || post.type === category);
}

async function deletePost(postId: string) {
  if (isDemoMode()) {
    writeDemoPosts(readDemoPosts().filter((row: any) => String(row.id) !== postId));
    return { ok: true };
  }

  const userId = await requiredUserId();
  const { data: post, error: postError } = await supabase.from("posts").select("user_id").eq("id", postId).single();
  if (postError) throw postError;
  if (post.user_id === userId) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  } else {
    const { error } = await (supabase as any).rpc("admin_moderate_post", {
      target_post: postId,
      requested_action: "delete",
    });
    if (error) throw error;
  }
  return { ok: true };
}

async function togglePostPin(postId: string) {
  if (isDemoMode()) {
    const rows = readDemoPosts();
    const index = rows.findIndex((row: any) => String(row.id) === postId);
    if (index === -1) throw new Error("Post not found.");
    rows[index] = { ...rows[index], is_pinned: !rows[index].is_pinned };
    writeDemoPosts(rows);
    return toPost(rows[index], DEMO_PROFILE);
  }

  const { error } = await (supabase as any).rpc("admin_moderate_post", {
    target_post: postId,
    requested_action: "toggle_pin",
  });
  if (error) throw error;
  return getPost(postId);
}

async function getCommunity() {
  if (isDemoMode()) return getDemoCommunity();

  const communityId = await requireCommunityManager();
  const { data, error } = await extendedDb.from("community_settings").select("*").eq("id", communityId).maybeSingle();
  if (error) throw error;
  const communityRow = data as JsonBody | null;
  return {
    id: id(communityRow?.id ?? "community"),
    communityId: "default",
    name: communityRow?.name ?? "Mohalla Community Hub",
    area: communityRow?.description ?? "Neighbourhood",
    city: communityRow?.welcome_message ?? "Karachi",
    latitude: communityRow?.latitude ?? null,
    longitude: communityRow?.longitude ?? null,
    logoUrl: communityRow?.logo_url ?? null,
    status: communityRow?.status ?? "approved",
    themePrimaryColor: communityRow?.theme_primary_color ?? "#1B5E20",
    themeSecondaryColor: communityRow?.theme_secondary_color ?? "#0288D1",
    themeBackgroundColor: communityRow?.theme_background_color ?? "#FAFDF8",
    themeBannerColor: communityRow?.theme_banner_color ?? "#FFFFFF",
    themeSidebarColor: communityRow?.theme_sidebar_color ?? "#FFFFFF",
    rules: communityRow?.rules ?? "",
  };
}

async function updateCommunity(payload: JsonBody) {
  if (isDemoMode()) return writeDemoCommunity(payload);

  const current = await getCommunity();
  const { data, error } = await extendedDb
    .from("community_settings")
    .update({
      name: payload.name ?? current.name,
      description: payload.area ?? current.area,
      welcome_message: payload.city ?? current.city,
      latitude: payload.latitude === undefined ? current.latitude ?? null : payload.latitude,
      longitude: payload.longitude === undefined ? current.longitude ?? null : payload.longitude,
      rules: payload.rules ?? current.rules,
      logo_url: payload.logoUrl ?? current.logoUrl ?? null,
      theme_primary_color: payload.themePrimaryColor ?? current.themePrimaryColor ?? "#1B5E20",
      theme_secondary_color: payload.themeSecondaryColor ?? current.themeSecondaryColor ?? "#0288D1",
      theme_background_color: payload.themeBackgroundColor ?? current.themeBackgroundColor ?? "#FAFDF8",
      theme_banner_color: payload.themeBannerColor ?? current.themeBannerColor ?? "#FFFFFF",
      theme_sidebar_color: payload.themeSidebarColor ?? current.themeSidebarColor ?? "#FFFFFF",
      updated_at: new Date().toISOString(),
    })
    .eq("id", asRowId(current.id))
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: id(data.id),
    communityId: "default",
    name: data.name,
    area: data.description ?? "",
    city: data.welcome_message ?? "",
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    logoUrl: data.logo_url ?? null,
    status: data.status ?? "approved",
    themePrimaryColor: data.theme_primary_color ?? "#1B5E20",
    themeSecondaryColor: data.theme_secondary_color ?? "#0288D1",
    themeBackgroundColor: data.theme_background_color ?? "#FAFDF8",
    themeBannerColor: data.theme_banner_color ?? "#FFFFFF",
    themeSidebarColor: data.theme_sidebar_color ?? "#FFFFFF",
    rules: data.rules ?? "",
  };
}

async function adminStats() {
  if (isDemoMode()) {
    const members = readDemoMembers();
    return {
      totalMembers: members.length,
      postsThisMonth: readDemoPosts().length,
      activeListings: readDemoRows(DEMO_LISTINGS_KEY).filter((listing: any) => listing.status === "available").length,
      pendingMembers: members.filter((member: any) => member.status === "pending").length,
    };
  }

  const communityId = await requireCommunityManager();
  const [members, posts, listings, pending] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("community_id", communityId),
    (supabase as any).from("posts").select("*", { count: "exact", head: true }).eq("community_id", communityId).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    (supabase as any).from("listings").select("*", { count: "exact", head: true }).eq("community_id", communityId).eq("status", "available"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("community_id", communityId).eq("membership_status", "pending"),
  ]);
  return {
    totalMembers: members.count ?? 0,
    postsThisMonth: posts.count ?? 0,
    activeListings: listings.count ?? 0,
    pendingMembers: pending.count ?? 0,
  };
}

async function createAnnouncement(payload: JsonBody) {
  const post = await createPost({ ...payload, type: "announcement", isPinned: true });
  notifyInstalledApps("announcement", String(post.id));
  return post;
}

async function getProfile(userIdParam: string) {
  const userId = await resolveRequestedUserId(userIdParam);
  if (isDemoMode() && userId === DEMO_USER_ID) {
    const demoListings = readDemoRows(DEMO_LISTINGS_KEY);
    return {
      profile: {
        userId: DEMO_USER_ID,
        displayName: profileName(DEMO_PROFILE),
        unitNumber: unit(DEMO_PROFILE),
        avatarUrl: null,
        whatsappNumber: null,
        showUnit: true,
        showPhone: true,
        showActivity: true,
        receiveTexts: true,
        createdAt: DEMO_PROFILE.created_at,
      },
      posts: readDemoPosts().map((row: any) => ({
        id: id(row.id),
        title: row.title,
        body: row.body,
        type: row.type,
        likesCount: row.likes_count ?? 0,
        commentsCount: row.comments_count ?? 0,
        createdAt: row.created_at,
        isPinned: Boolean(row.is_pinned),
      })),
      listings: demoListings.map((row: any) => ({
        id: id(row.id),
        title: row.title,
        price: row.price_pkr ?? 0,
        category: row.category,
        imageUrl: row.image_urls?.[0] ?? null,
        status: row.status,
        createdAt: row.created_at,
      })),
    };
  }

  const [{ data: profile }, { data: privateProfile }, postsResult, listingsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("private_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("listings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);
  const privateProfileData = privateProfile as any;

  return {
    profile: {
      userId,
      displayName: profileName(profile),
      unitNumber: unit(profile),
      avatarUrl: profile?.avatar_url ?? null,
      whatsappNumber: privateProfileData?.whatsapp_number ?? null,
      showUnit: privateProfileData?.show_unit ?? true,
      showPhone: privateProfileData?.show_phone ?? true,
      showActivity: privateProfileData?.show_activity ?? true,
      receiveTexts: privateProfileData?.receive_texts ?? true,
      createdAt: profile?.created_at ?? new Date().toISOString(),
    },
    posts: (postsResult.data ?? []).map((row: any) => ({
      id: id(row.id),
      title: row.title,
      body: row.body,
      type: row.type,
      likesCount: row.likes_count ?? 0,
      commentsCount: row.comments_count ?? 0,
      createdAt: row.created_at,
      isPinned: Boolean(row.is_pinned),
    })),
    listings: (listingsResult.data ?? []).map((row: any) => ({
      id: id(row.id),
      title: row.title,
      price: row.price_pkr ?? 0,
      category: row.category,
      imageUrl: row.image_urls?.[0] ?? null,
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}

async function getNotifications() {
  const userId = await currentUserId();
  if (isDemoMode()) return { notifications: [], unreadCount: 0 };

  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;

  const notifications = (data ?? []).map((row: any) => ({
    id: id(row.id),
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.data?.link ?? "",
    isRead: Boolean(row.is_read),
    createdAt: row.created_at ?? new Date().toISOString(),
  }));

  return { notifications, unreadCount: notifications.filter((notification) => !notification.isRead).length };
}

function mapPreferences(row?: any) {
  return {
    notifyComments: row?.notify_comments ?? true,
    notifyLikes: row?.notify_likes ?? true,
    notifySafety: row?.notify_safety ?? true,
    notifyEvents: row?.notify_events ?? true,
    notifyMessages: row?.notify_messages ?? true,
    notifyAnnouncements: row?.notify_announcements ?? true,
    notifyMarketplace: row?.notify_marketplace ?? true,
    notifyApprovals: row?.notify_approvals ?? true,
    notifyTexts: row?.notify_texts ?? true,
  };
}

async function getNotificationPreferences() {
  if (isDemoMode()) return { ...DEFAULT_PREFS, ...readDemoObject(DEMO_PREFS_KEY, {}) };
  const userId = await requiredUserId();
  const { data, error } = await extendedDb.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return mapPreferences(data);
}

async function saveNotificationPreferences(payload: JsonBody) {
  if (isDemoMode()) {
    const prefs = { ...DEFAULT_PREFS, ...payload };
    writeDemoObject(DEMO_PREFS_KEY, prefs);
    return prefs;
  }
  const userId = await requiredUserId();
  const { data, error } = await extendedDb
    .from("notification_preferences")
    .upsert({
      user_id: userId,
      notify_comments: payload.notifyComments,
      notify_likes: payload.notifyLikes,
      notify_safety: payload.notifySafety,
      notify_events: payload.notifyEvents,
      notify_messages: payload.notifyMessages,
      notify_announcements: payload.notifyAnnouncements,
      notify_marketplace: payload.notifyMarketplace,
      notify_approvals: payload.notifyApprovals,
      notify_texts: payload.notifyTexts,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapPreferences(data);
}

async function markNotificationsRead(notificationId?: string) {
  if (isDemoMode()) return { ok: true };
  const userId = await requiredUserId();
  let query = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
  if (notificationId) query = query.eq("id", notificationId);
  const { error } = await query;
  if (error) throw error;
  return { ok: true };
}

async function listPlaces() {
  if (isDemoMode()) return [];
  const { data, error } = await extendedDb.from("places").select("*").eq("is_active", true).order("category").order("name");
  if (error) throw error;
  return data ?? [];
}

async function listVolunteerOpportunities() {
  if (isDemoMode()) return [];
  const userId = await requiredUserId();
  const [{ data, error }, { data: signups, error: signupError }] = await Promise.all([
    extendedDb.from("volunteer_opportunities").select("*, volunteer_signups(user_id)").eq("is_active", true).order("created_at"),
    extendedDb.from("volunteer_signups").select("opportunity_id").eq("user_id", userId),
  ]);
  if (error) throw error;
  if (signupError) throw signupError;
  const joinedIds = new Set((signups ?? []).map((row: any) => row.opportunity_id));
  return (data ?? []).map((row: any) => ({
    ...row,
    joinedCount: row.volunteer_signups?.length ?? 0,
    isJoined: joinedIds.has(row.id),
  }));
}

async function toggleVolunteerSignup(opportunityId: string) {
  if (isDemoMode()) return { ok: true };
  const userId = await requiredUserId();
  const { data: existing, error: existingError } = await extendedDb
    .from("volunteer_signups")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const { error } = await extendedDb.from("volunteer_signups").delete().eq("id", existing.id);
    if (error) throw error;
    return { joined: false };
  }
  const { error } = await extendedDb.from("volunteer_signups").insert({ opportunity_id: opportunityId, user_id: userId });
  if (error) throw error;
  return { joined: true };
}

async function createModerationReport(payload: JsonBody) {
  if (isDemoMode()) return { ok: true };
  const userId = await requiredUserId();
  const { data, error } = await extendedDb
    .from("moderation_reports")
    .insert({
      reporter_id: userId,
      target_type: payload.targetType,
      target_id: String(payload.targetId),
      reason: payload.reason,
      details: payload.details ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function toggleUserBlock(payload: JsonBody) {
  if (isDemoMode()) return { blocked: true };
  const userId = await requiredUserId();
  const blockedId = String(payload.userId);
  const { data: existing, error: existingError } = await extendedDb
    .from("user_blocks")
    .select("*")
    .eq("blocker_id", userId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const { error } = await extendedDb.from("user_blocks").delete().eq("blocker_id", userId).eq("blocked_id", blockedId);
    if (error) throw error;
    return { blocked: false };
  }
  const { error } = await extendedDb.from("user_blocks").insert({ blocker_id: userId, blocked_id: blockedId });
  if (error) throw error;
  return { blocked: true };
}

export async function handleSupabaseApi<T = unknown>(url: string, method = "GET", body?: BodyInit | null): Promise<T> {
  const requestUrl = apiUrl(url);
  const path = requestUrl.pathname;
  const payload = parseBody(body);

  if (path === "/api/healthz") return { status: "ok" } as T;
  if (path === "/api/feed" && method === "GET") return listFeed(requestUrl.searchParams) as T;
  if (path === "/api/feed" && method === "POST") return createPost(payload) as T;
  if (/^\/api\/feed\/[^/]+$/.test(path) && method === "DELETE") return deletePost(path.split("/")[3]) as T;
  if (/^\/api\/feed\/[^/]+\/like$/.test(path) && method === "POST") return toggleLike(path.split("/")[3]) as T;
  if (/^\/api\/feed\/[^/]+\/comments$/.test(path) && method === "GET") return listComments(path.split("/")[3]) as T;
  if (/^\/api\/feed\/[^/]+\/comments$/.test(path) && method === "POST") return createComment(path.split("/")[3], payload) as T;
  if (path === "/api/marketplace" && method === "GET") return listListings(requestUrl.searchParams) as T;
  if (path === "/api/marketplace" && method === "POST") return createListing(payload) as T;
  if (/^\/api\/marketplace\/[^/]+$/.test(path) && method === "GET") return getListingById(path.split("/")[3]) as T;
  if (/^\/api\/marketplace\/[^/]+$/.test(path) && method === "DELETE") return deleteListing(path.split("/")[3]) as T;
  if (/^\/api\/marketplace\/[^/]+\/status$/.test(path) && method === "PATCH") return updateListingStatus(path.split("/")[3], payload) as T;
  if (path === "/api/listings" && method === "GET") return listListings(requestUrl.searchParams) as T;
  if (path === "/api/events" && method === "GET") return listEvents() as T;
  if (path === "/api/events" && method === "POST") return createEvent(payload) as T;
  if (/^\/api\/events\/[^/]+\/rsvp$/.test(path) && method === "POST") return rsvpEvent(path.split("/")[3], payload) as T;
  if (/^\/api\/events\/[^/]+\/rsvps$/.test(path) && method === "POST") return rsvpEvent(path.split("/")[3], payload) as T;
  if (path === "/api/polls" && method === "GET") return listPolls() as T;
  if (path === "/api/polls" && method === "POST") return createPoll(payload) as T;
  if (/^\/api\/polls\/[^/]+\/vote$/.test(path) && method === "POST") return votePoll(path.split("/")[3], payload) as T;
  if (path === "/api/safety" && method === "GET") return listSafety(requestUrl.searchParams) as T;
  if (path === "/api/safety" && method === "POST") return createSafetyAlert(payload) as T;
  if (/^\/api\/safety\/[^/]+\/resolve$/.test(path) && method === "PATCH") return resolveAlert(path.split("/")[3]) as T;
  if (/^\/api\/safety\/[^/]+\/comments$/.test(path) && method === "GET") return listAlertComments(path.split("/")[3]) as T;
  if (/^\/api\/safety\/[^/]+\/comments$/.test(path) && method === "POST") return createAlertComment(path.split("/")[3], payload) as T;
  if (path === "/api/city-feed" && method === "GET") return listCityPublications(requestUrl.searchParams) as T;
  if (path === "/api/city-feed/status" && method === "GET") return getCityPublicationStatus(requestUrl.searchParams) as T;
  if (path === "/api/city-feed/publish" && method === "POST") return publishCityPublication(payload) as T;
  if (path === "/api/city-feed/publish" && method === "DELETE") return unpublishCityPublication(payload) as T;
  if (path === "/api/messages" && method === "GET") return listMessageConversations() as T;
  if (path === "/api/messages/start" && method === "POST") return startConversation(payload) as T;
  if (/^\/api\/messages\/[^/]+$/.test(path) && method === "GET") return getMessageConversation(path.split("/")[3]) as T;
  if (/^\/api\/messages\/[^/]+\/messages$/.test(path) && method === "POST") return sendMessage(path.split("/")[3], payload) as T;
  if (/^\/api\/messages\/[^/]+\/read$/.test(path) && method === "POST") return markConversationRead(path.split("/")[3]) as T;
  if (path === "/api/admin/members" && method === "GET") return listAdminMembers(requestUrl.searchParams) as T;
  if (path === "/api/admin/members" && method === "POST") return createMember(payload) as T;
  if (/^\/api\/admin\/members\/[^/]+\/approve$/.test(path) && method === "PATCH") return updateMember(path.split("/")[4], "approve") as T;
  if (/^\/api\/admin\/members\/[^/]+\/reject$/.test(path) && method === "PATCH") return updateMember(path.split("/")[4], "reject") as T;
  if (/^\/api\/admin\/members\/[^/]+\/verify$/.test(path) && method === "PATCH") return updateMember(path.split("/")[4], "verify") as T;
  if (/^\/api\/admin\/members\/[^/]+\/role$/.test(path) && method === "PATCH") return updateMember(path.split("/")[4], "role", payload) as T;
  if (/^\/api\/admin\/members\/[^/]+$/.test(path) && method === "DELETE") return updateMember(path.split("/")[4], "delete") as T;
  if (path === "/api/admin/posts" && method === "GET") return listAdminPosts(requestUrl.searchParams) as T;
  if (/^\/api\/admin\/posts\/[^/]+$/.test(path) && method === "DELETE") return deletePost(path.split("/")[4]) as T;
  if (/^\/api\/admin\/posts\/[^/]+\/pin$/.test(path) && method === "PATCH") return togglePostPin(path.split("/")[4]) as T;
  if (path === "/api/admin/community" && method === "GET") return getCommunity() as T;
  if (path === "/api/admin/community" && method === "PUT") return updateCommunity(payload) as T;
  if (path === "/api/admin/stats" && method === "GET") return adminStats() as T;
  if (path === "/api/admin/announcements" && method === "POST") return createAnnouncement(payload) as T;
  if (path === "/api/settings/notifications" && method === "GET") return getNotificationPreferences() as T;
  if (path === "/api/settings/notifications") return saveNotificationPreferences(payload) as T;
  if (path === "/api/notifications" && method === "GET") return getNotifications() as T;
  if (path === "/api/notifications/read-all") return markNotificationsRead() as T;
  if (/^\/api\/notifications\/[^/]+\/read$/.test(path)) return markNotificationsRead(path.split("/")[3]) as T;
  if (path === "/api/places" && method === "GET") return listPlaces() as T;
  if (path === "/api/volunteer" && method === "GET") return listVolunteerOpportunities() as T;
  if (/^\/api\/volunteer\/[^/]+\/signup$/.test(path) && method === "POST") return toggleVolunteerSignup(path.split("/")[3]) as T;
  if (path === "/api/reports" && method === "POST") return createModerationReport(payload) as T;
  if (path === "/api/blocks" && method === "POST") return toggleUserBlock(payload) as T;
  if (path === "/api/community/members" && method === "GET") return listCommunityMembers(requestUrl.searchParams) as T;
  if (path === "/api/reviewers" && method === "GET") return listSocietyReviewers(requestUrl.searchParams) as T;
  if (path.startsWith("/api/profile/") && method === "GET") return getProfile(path.split("/").pop() ?? "") as T;
  if (path.startsWith("/api/profile/") && method === "PUT") return saveProfile(path.split("/").pop() ?? "", payload) as T;

  throw new Error(`This Vercel build does not include the old server route: ${path}`);
}

export function installSupabaseApiBridge() {
  if (bridgeInstalled || typeof window === "undefined") return;
  bridgeInstalled = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isApiRequest(input)) return originalFetch(input, init);

    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      const data = await handleSupabaseApi(url, method, init?.body);
      return jsonResponse(data);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : "Request failed" }, 500);
    }
  };
}
