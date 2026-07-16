import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { clearToken, getToken, getUser as getStoredUser, setToken } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  unitNumber: string;
  role: string;
  membershipStatus: "pending" | "approved" | "rejected";
  communityStatus: "pending" | "approved" | "rejected" | "suspended";
  avatarUrl?: string | null;
  community?: {
    id: string;
    name: string;
    area?: string | null;
    city?: string | null;
    logoUrl?: string | null;
    rejectionReason?: string | null;
    suspendedReason?: string | null;
    themePrimaryColor?: string | null;
    themeSecondaryColor?: string | null;
    themeBackgroundColor?: string | null;
    themeBannerColor?: string | null;
    themeSidebarColor?: string | null;
  } | null;
}

const APP_ROLES = ["super_admin", "admin", "moderator", "user"] as const;
const DEMO_COMMUNITY_KEY = "mohalla_demo_community";

function trustedAppRole(value: unknown) {
  return typeof value === "string" && APP_ROLES.includes(value as (typeof APP_ROLES)[number])
    ? value
    : undefined;
}

function getDemoCommunityForCurrentUser() {
  const fallback = {
    id: "default",
    name: "Mohalla Community Hub",
    area: "Gulberg",
    city: "Lahore",
    logoUrl: null,
    themePrimaryColor: "#1B5E20",
    themeSecondaryColor: "#0288D1",
    themeBackgroundColor: "#FAFDF8",
    themeBannerColor: "#FFFFFF",
    themeSidebarColor: "#FFFFFF",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(window.localStorage.getItem(DEMO_COMMUNITY_KEY) ?? "{}");
    return { ...fallback, ...saved };
  } catch {
    return fallback;
  }
}

async function loadCurrentUser(): Promise<CurrentUser | null> {
  const storedUser = getStoredUser();
  if (storedUser?.userId === "ahmed" && storedUser.email === "demo@mohalla.app") {
    const community = getDemoCommunityForCurrentUser();
    return {
      ...storedUser,
      membershipStatus: "approved",
      communityStatus: "approved",
      community: {
        id: String(community.id ?? "default"),
        name: community.name ?? "Mohalla Community Hub",
        area: community.area ?? null,
        city: community.city ?? null,
        logoUrl: community.logoUrl ?? null,
        themePrimaryColor: community.themePrimaryColor ?? null,
        themeSecondaryColor: community.themeSecondaryColor ?? null,
        themeBackgroundColor: community.themeBackgroundColor ?? null,
        themeBannerColor: community.themeBannerColor ?? null,
        themeSidebarColor: community.themeSidebarColor ?? null,
      },
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? (await supabase.auth.getUser()).data.user;

  if (!user) {
    clearToken();
    return null;
  }
  if (session?.access_token) {
    setToken(session.access_token);
  }

  const [profileResult, rolesResult, memberStatusResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    (supabase as any).rpc("my_member_status").maybeSingle(),
  ]);

  if (profileResult.error) throw new Error(`Could not load your profile: ${profileResult.error.message}`);
  if (rolesResult.error) throw new Error(`Could not load your role: ${rolesResult.error.message}`);
  if (memberStatusResult.error) throw new Error(`Could not load your membership status: ${memberStatusResult.error.message}`);

  const profile = profileResult.data;
  const roles = rolesResult.data;
  const memberStatus = memberStatusResult.data;
  const typedProfile = profile as any;
  const typedStatus = memberStatus as any;
  const profileCommunityId = typedStatus?.community_id ?? typedProfile?.community_id;
  const communityResult = profileCommunityId
    ? await (supabase as any).from("community_settings").select("*").eq("id", profileCommunityId).maybeSingle()
    : { data: null };
  if ("error" in communityResult && communityResult.error) {
    throw new Error(`Could not load your community: ${communityResult.error.message}`);
  }
  const { data: community } = communityResult;
  const resolvedCommunity = community ?? (
    typedStatus?.community_id
      ? {
          id: typedStatus.community_id,
          name: typedStatus.community_name,
          description: typedStatus.community_area,
          welcome_message: typedStatus.community_city,
          status: typedStatus.community_status,
          logo_url: typedStatus.logo_url,
          rejection_reason: typedStatus.rejection_reason,
          suspended_reason: typedStatus.suspended_reason,
          theme_primary_color: typedStatus.theme_primary_color,
          theme_secondary_color: typedStatus.theme_secondary_color,
          theme_background_color: typedStatus.theme_background_color,
          theme_banner_color: typedStatus.theme_banner_color,
          theme_sidebar_color: typedStatus.theme_sidebar_color,
        }
      : null
  );
  const role =
    trustedAppRole(roles?.find((row: any) => row.role === "super_admin")?.role) ??
    trustedAppRole(roles?.find((row: any) => row.role === "admin")?.role) ??
    trustedAppRole(roles?.find((row: any) => row.role === "moderator")?.role) ??
    trustedAppRole(roles?.[0]?.role) ??
    trustedAppRole(user.app_metadata?.role) ??
    "user";

  if ("email_verified_at" in (typedProfile ?? {}) && role !== "super_admin" && !typedProfile?.email_verified_at) {
    await supabase.auth.signOut();
    clearToken();
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? storedUser?.email ?? "",
    name:
      typedStatus?.display_name ??
      typedStatus?.full_name ??
      profile?.display_name ??
      profile?.full_name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      storedUser?.name ??
      user.email?.split("@")[0] ??
      "Resident",
    unitNumber: typedStatus?.unit_number ?? profile?.unit_number ?? user.user_metadata?.unit_number ?? storedUser?.unitNumber ?? "",
    role,
    membershipStatus:
      typedStatus?.membership_status === "approved" || typedStatus?.membership_status === "rejected"
        ? typedStatus.membership_status
        : typedProfile?.membership_status === "approved" || typedProfile?.membership_status === "rejected"
          ? typedProfile.membership_status
        : "pending",
    communityStatus:
      resolvedCommunity?.status === "approved" || resolvedCommunity?.status === "rejected" || resolvedCommunity?.status === "suspended"
        ? resolvedCommunity.status
        : "pending",
    avatarUrl: profile?.avatar_url ?? null,
    community: resolvedCommunity
      ? {
          id: resolvedCommunity.id,
          name: resolvedCommunity.name ?? "Mohalla Community",
          area: resolvedCommunity.description ?? null,
          city: resolvedCommunity.welcome_message ?? null,
          logoUrl: resolvedCommunity.logo_url ?? null,
          rejectionReason: resolvedCommunity.rejection_reason ?? null,
          suspendedReason: resolvedCommunity.suspended_reason ?? null,
          themePrimaryColor: resolvedCommunity.theme_primary_color ?? null,
          themeSecondaryColor: resolvedCommunity.theme_secondary_color ?? null,
          themeBackgroundColor: resolvedCommunity.theme_background_color ?? null,
          themeBannerColor: resolvedCommunity.theme_banner_color ?? null,
          themeSidebarColor: resolvedCommunity.theme_sidebar_color ?? null,
        }
      : null,
  };
}

export function useCurrentUser(options: { enabled?: boolean } = {}) {
  const token = getToken();
  return useQuery({
    queryKey: ["current-user", token],
    queryFn: loadCurrentUser,
    enabled: options.enabled ?? true,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function canManageCommunity(role?: string | null) {
  return role === "admin" || role === "moderator";
}

export function isSuperAdmin(role?: string | null) {
  return role === "super_admin";
}

export function useLogout() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  return async () => {
    await supabase.auth.signOut();
    clearToken();
    queryClient.clear();
    navigate("/login");
  };
}
