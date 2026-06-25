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
  avatarUrl?: string | null;
}

async function loadCurrentUser(): Promise<CurrentUser | null> {
  const storedUser = getStoredUser();
  if (storedUser?.userId === "ahmed" && storedUser.email === "demo@mohalla.app") {
    return { ...storedUser, membershipStatus: "approved" };
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
  const role =
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
    avatarUrl: profile?.avatar_url ?? null,
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

export function useLogout() {
  const [, navigate] = useLocation();

  return async () => {
    await supabase.auth.signOut();
    clearToken();
    navigate("/login");
  };
}
