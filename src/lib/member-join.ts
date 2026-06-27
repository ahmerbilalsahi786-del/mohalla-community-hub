import { supabase } from "@/integrations/supabase/client";

export interface MemberInviteProfile {
  username?: string;
  fullName?: string;
  unitNumber?: string;
}

export function inviteLoginPath(joinCommunityId: string, invitedCommunityName?: string) {
  const params = new URLSearchParams({ join: joinCommunityId });
  if (invitedCommunityName?.trim()) params.set("community", invitedCommunityName.trim());
  return `/login?${params.toString()}`;
}

export function inviteRegisterPath(joinCommunityId: string, invitedCommunityName?: string) {
  const params = new URLSearchParams({ join: joinCommunityId });
  if (invitedCommunityName?.trim()) params.set("community", invitedCommunityName.trim());
  return `/register?${params.toString()}`;
}

export async function requestMemberJoin(joinCommunityId: string, profile: MemberInviteProfile = {}) {
  const id = joinCommunityId.trim();
  if (!id) throw new Error("This invite link is missing its community id.");

  const { error } = await (supabase as any).rpc("request_member_join", {
    invited_community_id: id,
    requested_username: profile.username?.trim() || null,
    requested_full_name: profile.fullName?.trim() || null,
    requested_unit_number: profile.unitNumber?.trim() || null,
  });

  if (error) throw error;
}
