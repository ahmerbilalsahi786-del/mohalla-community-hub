import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { clearToken, getUser as getStoredUser } from "@/lib/auth";
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

async function loadCurrentUser(): Promise<CurrentUser | null> {
  const storedUser = getStoredUser();
  if (storedUser?.userId === "ahmed" && storedUser.email === "demo@mohalla.app") {
    return {
      ...storedUser,
      membershipStatus: "approved",
      communityStatus: "approved",
      community: {
        id: "default",
        name: "Mohalla Community Hub",
        area: "Gulberg",
        city: "Lahore",
        logoUrl: null,
      },
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    clearToken();
    return null;
  }

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const typedProfile = profile as any;
  const { data: community } = typedProfile?.community_id
    ? await (supabase as any).from("community_settings").select("*").eq("id", typedProfile.community_id).maybeSingle()
    : { data: null };
  const role =
    roles?.find((row: any) => row.role === "super_admin")?.role ??
    roles?.find((row: any) => row.role === "admin")?.role ??
    roles?.find((row: any) => row.role === "moderator")?.role ??
    roles?.[0]?.role ??
    user.app_metadata?.role ??
    storedUser?.role ??
    "user";

  return {
    userId: user.id,
    email: user.email ?? storedUser?.email ?? "",
    name:
      profile?.display_name ??
      profile?.full_name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      storedUser?.name ??
      user.email?.split("@")[0] ??
      "Resident",
    unitNumber: profile?.unit_number ?? user.user_metadata?.unit_number ?? storedUser?.unitNumber ?? "",
    role,
    membershipStatus:
      typedProfile?.membership_status === "approved" || typedProfile?.membership_status === "rejected"
        ? typedProfile.membership_status
        : "pending",
    communityStatus:
      community?.status === "approved" || community?.status === "rejected" || community?.status === "suspended"
        ? community.status
        : "pending",
    avatarUrl: profile?.avatar_url ?? null,
    community: community
      ? {
          id: community.id,
          name: community.name ?? "Mohalla Community",
          area: community.description ?? null,
          city: community.welcome_message ?? null,
          logoUrl: community.logo_url ?? null,
          rejectionReason: community.rejection_reason ?? null,
          suspendedReason: community.suspended_reason ?? null,
          themePrimaryColor: community.theme_primary_color ?? null,
          themeSecondaryColor: community.theme_secondary_color ?? null,
          themeBackgroundColor: community.theme_background_color ?? null,
          themeBannerColor: community.theme_banner_color ?? null,
          themeSidebarColor: community.theme_sidebar_color ?? null,
        }
      : null,
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: loadCurrentUser,
    staleTime: 60_000,
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

  return async () => {
    await supabase.auth.signOut();
    clearToken();
    navigate("/login");
  };
}
