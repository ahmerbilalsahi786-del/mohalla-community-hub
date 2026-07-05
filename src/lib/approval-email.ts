import { supabase } from "@/integrations/supabase/client";

export type ApprovalEmailEvent = "pending" | "approved";

export async function sendApprovalEmail(userId: string, event: ApprovalEmailEvent = "approved") {
  const { error } = await supabase.functions.invoke("send-approval-email", {
    body: { userId, event },
  });

  if (error) throw error;
}

export function sendPendingApprovalEmail(userId: string) {
  return sendApprovalEmail(userId, "pending");
}

export function sendMemberApprovedEmail(userId: string) {
  return sendApprovalEmail(userId, "approved");
}
