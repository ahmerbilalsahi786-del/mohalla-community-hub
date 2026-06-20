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
const TOKEN_KEY = "mohalla_token";
const DEMO_USER_ID = "ahmed";
const DEMO_POSTS_KEY = "mohalla_demo_posts";
const DEMO_LISTINGS_KEY = "mohalla_demo_listings";
const DEMO_EVENTS_KEY = "mohalla_demo_events";
const DEMO_ALERTS_KEY = "mohalla_demo_alerts";
const DEMO_POLLS_KEY = "mohalla_demo_polls";
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
  const category = params.get("category");
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error && !isDemoMode()) throw error;

  const remoteRows = error ? [] : data ?? [];
  const demoRows = isDemoMode() ? readDemoPosts() : [];
  let rows = applySearch([...demoRows, ...remoteRows], search, ["title", "body", "type"]);
  if (category && category !== "all") {
    rows = rows.filter((row: any) => row.type === category);
  }

  const profiles = await profilesById(rows.map((row: any) => row.user_id).filter((userId: string) => userId !== DEMO_USER_ID));
  profiles.set(DEMO_USER_ID, DEMO_PROFILE);
  const posts = pageRows(rows, page, limit).map((row: any) => toPost(row, profiles.get(row.user_id)));
  return { posts, total: rows.length, page, limit, hasMore: page * limit < rows.length };
}

async function listListings(params: URLSearchParams) {
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 20);
  const search = params.get("search");
  const category = params.get("category");
  const minPrice = Number(params.get("minPrice") ?? 0);
  const maxPrice = Number(params.get("maxPrice") ?? 0);
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error && !isDemoMode()) throw error;

  const remoteRows = error ? [] : data ?? [];
  let rows = applySearch([...(isDemoMode() ? readDemoRows(DEMO_LISTINGS_KEY) : []), ...remoteRows], search, ["title", "description", "category"]);
  if (category && category !== "all") rows = rows.filter((row: any) => row.category === category);
  if (minPrice) rows = rows.filter((row: any) => Number(row.price_pkr ?? 0) >= minPrice);
  if (maxPrice) rows = rows.filter((row: any) => Number(row.price_pkr ?? 0) <= maxPrice);
  const profiles = await profilesById(rows.map((row: any) => row.user_id).filter((userId: string) => userId !== DEMO_USER_ID));
  profiles.set(DEMO_USER_ID, DEMO_PROFILE);
  const listings = pageRows(rows, page, limit).map((row: any) => toListing(row, profiles.get(row.user_id)));
  return { listings, total: rows.length, page, limit, hasMore: page * limit < rows.length };
}

async function listEvents() {
  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
  if (error && !isDemoMode()) throw error;

  const rows = [...(isDemoMode() ? readDemoRows(DEMO_EVENTS_KEY) : []), ...((error ? [] : data) ?? [])];
  const profiles = await profilesById(rows.map((row: any) => row.user_id).filter((userId: string) => userId !== DEMO_USER_ID));
  profiles.set(DEMO_USER_ID, DEMO_PROFILE);
  const today = new Date().toISOString().slice(0, 10);
  const events = rows.map((row: any) => toEvent(row, profiles.get(row.user_id)));
  return {
    upcoming: events.filter((event) => event.date >= today),
    past: events.filter((event) => event.date < today),
  };
}

async function listPolls() {
  const { data, error } = await supabase.from("polls").select("*, poll_options(*)").order("created_at", { ascending: false });
  if (error && !isDemoMode()) throw error;

  const remoteRows = error ? [] : data ?? [];
  const profiles = await profilesById(remoteRows.map((row: any) => row.user_id).filter((userId: string) => userId !== DEMO_USER_ID));
  profiles.set(DEMO_USER_ID, DEMO_PROFILE);
  const now = Date.now();
  const polls = remoteRows.map((row: any) => {
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
  const demoPolls = (isDemoMode() ? readDemoRows(DEMO_POLLS_KEY) : []).map((poll: any) => ({
    ...poll,
    isEnded: new Date(poll.endsAt).getTime() < now,
  }));
  const mergedPolls = [...demoPolls, ...polls];

  return {
    active: mergedPolls.filter((poll) => !poll.isEnded),
    ended: mergedPolls.filter((poll) => poll.isEnded),
  };
}

async function listSafety(params: URLSearchParams) {
  const resolved = params.get("resolved");
  let query = supabase.from("safety_alerts").select("*").order("created_at", { ascending: false });
  if (resolved === "true") query = query.eq("is_resolved", true);
  if (resolved === "false") query = query.eq("is_resolved", false);

  const { data, error } = await query;
  if (error && !isDemoMode()) throw error;

  let rows = [...(isDemoMode() ? readDemoRows(DEMO_ALERTS_KEY) : []), ...((error ? [] : data) ?? [])];
  if (resolved === "true") rows = rows.filter((row: any) => Boolean(row.is_resolved));
  if (resolved === "false") rows = rows.filter((row: any) => !Boolean(row.is_resolved));
  const profiles = await profilesById(rows.map((row: any) => row.user_id).filter((userId: string) => userId !== DEMO_USER_ID));
  profiles.set(DEMO_USER_ID, DEMO_PROFILE);
  return rows.map((row: any) => toAlert(row, profiles.get(row.user_id)));
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

async function createListing(payload: JsonBody) {
  if (isDemoMode()) return createDemoListing(payload);

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
  if (isDemoMode()) return createDemoEvent(payload);

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
  if (isDemoMode()) return createDemoAlert(payload);

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
  if (isDemoMode() && userId === DEMO_USER_ID) {
    const demoListings = readDemoRows(DEMO_LISTINGS_KEY);
    return {
      profile: {
        userId: DEMO_USER_ID,
        displayName: profileName(DEMO_PROFILE),
        unitNumber: unit(DEMO_PROFILE),
        avatarUrl: null,
        whatsappNumber: null,
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
