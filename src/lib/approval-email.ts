import { supabase } from "@/integrations/supabase/client";

export async function sendApprovalEmail(userId: string) {
  const { error } = await supabase.functions.invoke("send-approval-email", {
    body: { userId },
  });

  if (error) throw error;
}
