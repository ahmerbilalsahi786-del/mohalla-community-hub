import { supabase } from "@/integrations/supabase/client";

type JsonBody = Record<string, any>;

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
const DEFAULT_PREFS = {
  notifyComments: true,
  notifyLikes: true,
  notifySafety: true,
  notifyAnnouncements: true,
  notifyMarketplace: true,
  notifyApprovals: true,
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

async function currentUserId() {
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

async function resolveRequestedUserId(value?: string | null) {
  if (!value || value === "ahmed" || value === "default") return currentUserId();
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
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function toEvent(row: any, profile?: any) {
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
    imageUrl: row.image_url,
    rsvpCount: row.rsvp_count ?? 0,
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
    imageUrl: null,
    severity: row.severity ?? "medium",
    isResolved: Boolean(row.is_resolved),
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

async function listFeed(params: URLSearchParams) {
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const search = params.get("search");
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const rows = applySearch(data ?? [], search, ["title", "body", "type"]);
  const profiles = await profilesById(rows.map((row: any) => row.user_id));
  const posts = pageRows(rows, page, limit).map((row: any) => toPost(row, profiles.get(row.user_id)));
  return { posts, total: rows.length, page, limit, hasMore: page * limit < rows.length };
}

async function listListings(params: URLSearchParams) {
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const search = params.get("search");
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const rows = applySearch(data ?? [], search, ["title", "description", "category"]);
  const profiles = await profilesById(rows.map((row: any) => row.user_id));
  const listings = pageRows(rows, page, limit).map((row: any) => toListing(row, profiles.get(row.user_id)));
  return { listings, total: rows.length, page, limit, hasMore: page * limit < rows.length };
}

async function listEvents() {
  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
  if (error) throw error;

  const profiles = await profilesById((data ?? []).map((row: any) => row.user_id));
  const today = new Date().toISOString().slice(0, 10);
  const events = (data ?? []).map((row: any) => toEvent(row, profiles.get(row.user_id)));
  return {
    upcoming: events.filter((event) => event.date >= today),
    past: events.filter((event) => event.date < today),
  };
}

async function listPolls() {
  const { data, error } = await supabase.from("polls").select("*, poll_options(*)").order("created_at", { ascending: false });
  if (error) throw error;

  const profiles = await profilesById((data ?? []).map((row: any) => row.user_id));
  const now = Date.now();
  const polls = (data ?? []).map((row: any) => {
    const options = row.poll_options ?? [];
    const endsAt = row.ends_at ?? new Date(Date.now() + 86400000).toISOString();
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
      totalVotes: row.total_votes ?? 0,
      voteCounts: options.map((option: any) => option.votes_count ?? 0),
      myVoteIndex: null,
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
  let query = supabase.from("safety_alerts").select("*").order("created_at", { ascending: false });
  if (resolved === "true") query = query.eq("is_resolved", true);
  if (resolved === "false") query = query.eq("is_resolved", false);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const profiles = await profilesById(rows.map((row: any) => row.user_id));
  return rows.map((row: any) => toAlert(row, profiles.get(row.user_id)));
}

async function createPost(payload: JsonBody) {
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

async function createListing(payload: JsonBody) {
  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: userId,
      title: payload.title,
      description: payload.description,
      price_pkr: payload.pricePkr ?? null,
      category: payload.category ?? "other",
      condition: payload.condition ?? "good",
      image_urls: payload.imageUrls ?? [],
      whatsapp_number: payload.whatsappNumber ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([userId]);
  return toListing(data, profiles.get(userId));
}

async function createEvent(payload: JsonBody) {
  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: userId,
      title: payload.title,
      description: payload.description ?? "",
      event_date: payload.date,
      event_time: payload.time ?? null,
      location: payload.location ?? null,
      image_url: payload.imageUrl ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([userId]);
  return toEvent(data, profiles.get(userId));
}

async function createSafetyAlert(payload: JsonBody) {
  const userId = await requiredUserId();
  const { data, error } = await supabase
    .from("safety_alerts")
    .insert({
      user_id: userId,
      alert_type: payload.type ?? "general",
      title: payload.title,
      description: payload.description,
      location: payload.locationDetail ?? null,
      severity: payload.severity ?? "medium",
    })
    .select("*")
    .single();
  if (error) throw error;
  const profiles = await profilesById([userId]);
  return toAlert(data, profiles.get(userId));
}

async function createPoll(payload: JsonBody) {
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

async function saveProfile(userIdParam: string, payload: JsonBody) {
  const userId = await resolveRequestedUserId(userIdParam);
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

  await supabase
    .from("private_profiles")
    .upsert({ id: userId, whatsapp_number: payload.whatsappNumber, updated_at: new Date().toISOString() });

  return {
    userId,
    displayName: profileName(data),
    unitNumber: unit(data),
    avatarUrl: data.avatar_url,
    whatsappNumber: payload.whatsappNumber ?? null,
    createdAt: data.created_at ?? new Date().toISOString(),
  };
}

async function listMembers(params: URLSearchParams) {
  const limit = Number(params.get("limit") ?? 100);
  const { data, error } = await supabase.from("profiles").select("*, private_profiles(*), user_roles(*)").limit(limit);
  if (error) throw error;

  return (data ?? []).map((profile: any) => ({
    id: id(profile.id),
    communityId: "default",
    userId: profile.id,
    name: profileName(profile),
    unitNumber: unit(profile),
    phone: profile.private_profiles?.phone ?? profile.private_profiles?.whatsapp_number ?? "",
    status: profile.is_verified ? "approved" : "pending",
    role: profile.user_roles?.[0]?.role ?? "user",
    isVerified: Boolean(profile.is_verified),
    joinDate: profile.created_at ?? new Date().toISOString(),
  }));
}

async function getProfile(userIdParam: string) {
  const userId = await resolveRequestedUserId(userIdParam);
  const [{ data: profile }, { data: privateProfile }, postsResult, listingsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("private_profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("listings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  return {
    profile: {
      userId,
      displayName: profileName(profile),
      unitNumber: unit(profile),
      avatarUrl: profile?.avatar_url ?? null,
      whatsappNumber: privateProfile?.whatsapp_number ?? null,
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

export async function handleSupabaseApi<T = unknown>(url: string, method = "GET", body?: BodyInit | null): Promise<T> {
  const requestUrl = apiUrl(url);
  const path = requestUrl.pathname;
  const payload = parseBody(body);

  if (path === "/api/healthz") return { status: "ok" } as T;
  if (path === "/api/feed" && method === "GET") return listFeed(requestUrl.searchParams) as T;
  if (path === "/api/feed" && method === "POST") return createPost(payload) as T;
  if (path === "/api/marketplace" && method === "GET") return listListings(requestUrl.searchParams) as T;
  if (path === "/api/marketplace" && method === "POST") return createListing(payload) as T;
  if (path === "/api/listings" && method === "GET") return listListings(requestUrl.searchParams) as T;
  if (path === "/api/events" && method === "GET") return listEvents() as T;
  if (path === "/api/events" && method === "POST") return createEvent(payload) as T;
  if (path === "/api/polls" && method === "GET") return listPolls() as T;
  if (path === "/api/polls" && method === "POST") return createPoll(payload) as T;
  if (path === "/api/safety" && method === "GET") return listSafety(requestUrl.searchParams) as T;
  if (path === "/api/safety" && method === "POST") return createSafetyAlert(payload) as T;
  if (path === "/api/admin/members" && method === "GET") return listMembers(requestUrl.searchParams) as T;
  if (path === "/api/settings/notifications" && method === "GET") return DEFAULT_PREFS as T;
  if (path === "/api/settings/notifications") return { ...DEFAULT_PREFS, ...payload } as T;
  if (path === "/api/notifications" && method === "GET") return getNotifications() as T;
  if (path === "/api/notifications/read-all") return { ok: true } as T;
  if (/^\/api\/notifications\/[^/]+\/read$/.test(path)) return { ok: true } as T;
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
