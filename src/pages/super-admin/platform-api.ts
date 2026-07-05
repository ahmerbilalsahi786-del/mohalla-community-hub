import { supabase } from "@/integrations/supabase/client";
import { sendApprovalEmail } from "@/lib/approval-email";

const db = supabase as any;

export type CommunityStatus = "pending" | "approved" | "rejected" | "suspended";

export interface PlatformCommunity {
  id: string;
  name: string;
  area: string;
  city: string;
  status: CommunityStatus;
  logoUrl?: string | null;
  adminId?: string | null;
  adminName: string;
  adminEmail: string;
  memberCount: number;
  createdAt: string;
  rejectionReason?: string | null;
  suspendedReason?: string | null;
  themePrimaryColor?: string | null;
  themeSecondaryColor?: string | null;
  themeBackgroundColor?: string | null;
  themeBannerColor?: string | null;
  themeSidebarColor?: string | null;
}

function toCommunity(row: any, profile?: any, memberCount = 0): PlatformCommunity {
  return {
    id: row.id,
    name: row.name ?? "Mohalla Community",
    area: row.description ?? "",
    city: row.welcome_message ?? "",
    status: row.status ?? "pending",
    logoUrl: row.logo_url ?? null,
    adminId: row.requested_by_user_id ?? null,
    adminName: profile?.display_name ?? profile?.full_name ?? "Community admin",
    adminEmail: row.requested_by_email ?? profile?.email ?? "",
    memberCount,
    createdAt: row.created_at ?? row.updated_at ?? new Date().toISOString(),
    rejectionReason: row.rejection_reason ?? null,
    suspendedReason: row.suspended_reason ?? null,
    themePrimaryColor: row.theme_primary_color ?? "#1B5E20",
    themeSecondaryColor: row.theme_secondary_color ?? "#0288D1",
    themeBackgroundColor: row.theme_background_color ?? "#FAFDF8",
    themeBannerColor: row.theme_banner_color ?? "#FFFFFF",
    themeSidebarColor: row.theme_sidebar_color ?? "#FFFFFF",
  };
}

export async function fetchPlatformCommunities(status: CommunityStatus | "all" = "pending") {
  let query = db.from("community_settings").select("*").order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const ids = rows.map((row: any) => row.id);
  const adminIds = rows.map((row: any) => row.requested_by_user_id).filter(Boolean);

  const [{ data: profiles }, { data: members }] = await Promise.all([
    adminIds.length ? db.from("profiles").select("id, display_name, full_name, email").in("id", adminIds) : { data: [] },
    ids.length ? db.from("profiles").select("community_id").in("community_id", ids) : { data: [] },
  ]);

  const profileById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
  const memberCounts = new Map<string, number>();
  for (const member of members ?? []) {
    memberCounts.set(member.community_id, (memberCounts.get(member.community_id) ?? 0) + 1);
  }

  return rows.map((row: any) => toCommunity(row, profileById.get(row.requested_by_user_id), memberCounts.get(row.id) ?? 0));
}

export async function fetchPlatformDashboard() {
  const [communities, users, posts, listings] = await Promise.all([
    fetchPlatformCommunities("all"),
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("posts").select("*", { count: "exact", head: true }),
    db.from("listings").select("*", { count: "exact", head: true }),
  ]);

  return {
    communities,
    totalUsers: users.count ?? 0,
    totalPosts: posts.count ?? 0,
    totalListings: listings.count ?? 0,
    counts: {
      pending: communities.filter((community: PlatformCommunity) => community.status === "pending").length,
      approved: communities.filter((community: PlatformCommunity) => community.status === "approved").length,
      rejected: communities.filter((community: PlatformCommunity) => community.status === "rejected").length,
      suspended: communities.filter((community: PlatformCommunity) => community.status === "suspended").length,
      all: communities.length,
    },
  };
}

export async function updateCommunityStatus(id: string, status: Exclude<CommunityStatus, "pending">, reason?: string) {
  const { error } = await db.rpc("platform_update_community_status", {
    target_community: id,
    requested_status: status,
    reason: reason ?? null,
  });
  if (error) throw error;

  if (status === "approved") {
    const { data } = await db.from("community_settings").select("requested_by_user_id").eq("id", id).maybeSingle();
    if (data?.requested_by_user_id) {
      try {
        await sendApprovalEmail(data.requested_by_user_id, "approved");
      } catch (emailError) {
        console.warn("Community approval email could not be sent:", emailError);
      }
    }
  }
}

export async function fetchPlatformCommunity(id: string) {
  const { data, error } = await db.from("community_settings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Community not found");

  const [{ data: profile }, memberCount, postCount, listingCount, recentPosts, recentSignups] = await Promise.all([
    data.requested_by_user_id
      ? db.from("profiles").select("*").eq("id", data.requested_by_user_id).maybeSingle()
      : { data: null },
    db.from("profiles").select("*", { count: "exact", head: true }).eq("community_id", id),
    db.from("posts").select("*", { count: "exact", head: true }).eq("community_id", id),
    db.from("listings").select("*", { count: "exact", head: true }).eq("community_id", id),
    db.from("posts").select("id, title, type, created_at").eq("community_id", id).order("created_at", { ascending: false }).limit(6),
    db.from("profiles").select("id, display_name, full_name, created_at").eq("community_id", id).order("created_at", { ascending: false }).limit(6),
  ]);

  return {
    community: toCommunity(data, profile, memberCount.count ?? 0),
    adminProfile: profile,
    stats: {
      members: memberCount.count ?? 0,
      posts: postCount.count ?? 0,
      listings: listingCount.count ?? 0,
    },
    recentPosts: recentPosts.data ?? [],
    recentSignups: recentSignups.data ?? [],
  };
}

export async function updatePlatformCommunityBranding(id: string, payload: Partial<PlatformCommunity>) {
  const { error } = await db
    .from("community_settings")
    .update({
      logo_url: payload.logoUrl ?? null,
      theme_primary_color: payload.themePrimaryColor,
      theme_secondary_color: payload.themeSecondaryColor,
      theme_background_color: payload.themeBackgroundColor,
      theme_banner_color: payload.themeBannerColor,
      theme_sidebar_color: payload.themeSidebarColor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
