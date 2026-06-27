import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Vercel sends baseline security headers", async () => {
  const config = JSON.parse(await read("vercel.json"));
  const headers = new Map(config.headers[0].headers.map((header) => [header.key, header.value]));
  for (const required of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    assert.ok(headers.has(required), `${required} is required`);
  }
});

test("browser Supabase config rejects secret keys and has no hardcoded project fallback", async () => {
  for (const path of ["vite.config.ts", "src/integrations/supabase/client.ts", "src/lib/supabase.ts"]) {
    const source = await read(path);
    assert.match(source, /sb_secret_/);
    assert.doesNotMatch(source, /DEFAULT_SUPABASE_(URL|PUBLISHABLE_KEY)/);
  }
  const productionEnv = await read(".env.production");
  assert.match(productionEnv, /VITE_SUPABASE_URL=https:\/\/ytlzepxlwpzeirccwsov\.supabase\.co/);
  assert.match(productionEnv, /VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_/);
  assert.doesNotMatch(productionEnv, /sb_secret_/);

  const vercelIgnore = await read(".vercelignore");
  assert.match(vercelIgnore, /!\.env\.production/);
});

test("production migration protects membership and upload ownership", async () => {
  const migration = await read("supabase/migrations/20260625190000_production_security_and_features.sql");
  assert.match(migration, /revoke all on all tables in schema public from anon/i);
  assert.match(migration, /membership_status = 'approved'/i);
  assert.match(migration, /storage\.foldername\(name\)/i);
  assert.match(migration, /owner_id = auth\.uid\(\)::text/i);
  assert.match(migration, /admin_manage_member/i);
  assert.match(migration, /delete_my_account/i);
});

test("community approval guard allows signup requester linking", async () => {
  const migration = await read("supabase/migrations/20260627090000_fix_signup_community_guard.sql");
  assert.match(migration, /signup_requester_link/i);
  assert.match(migration, /old\.requested_by_user_id is null/i);
  assert.match(migration, /new\.requested_by_user_id is not null/i);
  assert.match(migration, /Only the platform owner can change community approval status/i);
});

test("member invite signup joins an approved existing community", async () => {
  const migration = await read("supabase/migrations/20260627100000_member_invite_join_flow.sql");
  assert.match(migration, /registration_type = 'member'/i);
  assert.match(migration, /join_community_id/i);
  assert.match(migration, /status = 'approved'/i);
  assert.match(migration, /'user'::public\.app_role/i);

  const register = await read("src/pages/Register.tsx");
  assert.match(register, /registration_type: 'member'/i);
  assert.match(register, /join_community_id: joinCommunityId/i);
  assert.match(register, /registration_type: 'community_admin'/i);

  const inviteTools = await read("src/components/community/invite-tools.tsx");
  assert.match(inviteTools, /\/register\?join=/i);
});

test("member invite repair migration recovers existing misplaced pending profiles", async () => {
  const migration = await read("supabase/migrations/20260627110000_repair_member_invite_profiles.sql");
  assert.match(migration, /repair_member_invite_profiles/i);
  assert.match(migration, /auth\.users/i);
  assert.match(migration, /raw_user_meta_data->>'join_community_id'/i);
  assert.match(migration, /membership_status = 'pending'/i);
  assert.match(migration, /is_verified = false/i);
  assert.match(migration, /select public\.repair_member_invite_profiles\(\)/i);
});

test("existing members can re-apply through invite links", async () => {
  const migration = await read("supabase/migrations/20260627123000_member_join_request_rpc.sql");
  assert.match(migration, /create or replace function public\.request_member_join/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /membership_status = 'pending'/);
  assert.match(migration, /is_verified = false/);
  assert.match(migration, /grant execute on function public\.request_member_join\(uuid, text, text, text\) to authenticated/);
  assert.match(migration, /create or replace function public\.my_member_status/);
  assert.match(migration, /grant execute on function public\.my_member_status\(\) to authenticated/);

  const joinHelper = await read("src/lib/member-join.ts");
  assert.match(joinHelper, /request_member_join/);
  assert.match(joinHelper, /inviteLoginPath/);
  assert.match(joinHelper, /inviteRegisterPath/);

  const register = await read("src/pages/Register.tsx");
  assert.match(register, /signInExistingInviteMember/);
  assert.match(register, /requestInviteForSignedInMember/);
  assert.match(register, /inviteLoginPath\(joinCommunityId, invitedCommunityName\)/);

  const login = await read("src/pages/Login.tsx");
  assert.match(login, /requestMemberJoin\(joinCommunityId\)/);

  const currentUser = await read("src/hooks/use-current-user.ts");
  assert.match(currentUser, /my_member_status/);
  assert.match(currentUser, /profileCommunityId/);
});

test("admin access and member management are scoped to trusted manager state", async () => {
  const currentUser = await read("src/hooks/use-current-user.ts");
  assert.match(currentUser, /queryKey: \["current-user", token\]/);
  assert.match(currentUser, /trustedAppRole/);
  assert.doesNotMatch(currentUser, /storedUser\?\.role/);

  const login = await read("src/pages/Login.tsx");
  assert.match(login, /can_manage_own_community/);
  assert.match(login, /queryClient\.clear\(\)/);

  const api = await read("src/lib/supabase-api.ts");
  assert.match(api, /requireCommunityManager/);
  assert.match(api, /listAdminMembers/);
  assert.match(api, /listCommunityMembers/);
  assert.match(api, /eq\("community_id", communityId\)/);
  assert.match(api, /\/api\/admin\/members" && method === "GET"\) return listAdminMembers/);
  assert.match(api, /\/api\/community\/members" && method === "GET"\) return listCommunityMembers/);

  const adminMembers = await read("src/pages/admin/Members.tsx");
  assert.match(adminMembers, /loadAdminMembers/);
  assert.match(adminMembers, /admin_list_members/);
  assert.match(adminMembers, /admin_manage_member/);
  assert.match(adminMembers, /setQueriesData<Member\[]>/);
  assert.match(adminMembers, /queryKey: \['admin-members', communityId\]/);
  assert.match(adminMembers, /titleCaseWord\(member\.role\)/);

  const adminLayout = await read("src/pages/admin/AdminLayout.tsx");
  assert.match(adminLayout, /admin-members-pending-count/);
  assert.match(adminLayout, /admin_list_members/);

  const pending = await read("src/pages/MembershipPending.tsx");
  assert.match(pending, /refreshSession/);
  assert.match(pending, /refetch\(\)/);
  assert.match(pending, /navigate\("\/"\)/);

  const registerPage = await read("src/pages/Register.tsx");
  assert.doesNotMatch(registerPage, /resendSignupConfirmation/);
  assert.doesNotMatch(registerPage, /Resend confirmation email/);

  const loginPage = await read("src/pages/Login.tsx");
  assert.doesNotMatch(loginPage, /shouldResendSignupConfirmation/);

  assert.doesNotMatch(adminMembers, /sendApprovalEmail/);

  const edgeFunction = await read("supabase/functions/send-approval-email/index.ts");
  assert.match(edgeFunction, /RESEND_API_KEY/);
  assert.match(edgeFunction, /membership_status !== "approved"/);
  assert.match(edgeFunction, /api\.resend\.com\/emails/);

  const memberListRpc = await read("supabase/migrations/20260627113000_admin_member_list_rpc.sql");
  assert.match(memberListRpc, /create or replace function public\.admin_list_members/);
  assert.match(memberListRpc, /public\.can_manage_own_community\(\)/);
  assert.match(memberListRpc, /p\.community_id = actor_community/);
  assert.match(memberListRpc, /grant execute on function public\.admin_list_members\(text\) to authenticated/);
});
