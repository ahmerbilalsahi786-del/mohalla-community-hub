import { supabase } from "@/integrations/supabase/client";

export type ApprovalEmailEvent = "pending" | "approved";

export type ApprovalEmailResult = {
  sent?: boolean;
  count?: number;
  skipped?: boolean;
  reason?: string;
};

async function approvalEmailErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const details = await context.clone().json();
        if (details?.error) return String(details.error);
      } catch {
        try {
          const text = await context.clone().text();
          if (text) return text;
        } catch {
          // Fall through to generic error handling below.
        }
      }
    }
  }

  return error instanceof Error ? error.message : "Approval email could not be sent.";
}

export async function sendApprovalEmail(userId: string, event: ApprovalEmailEvent = "approved") {
  const { data, error } = await supabase.functions.invoke<ApprovalEmailResult>("send-approval-email", {
    body: { userId, event },
  });

  if (error) throw new Error(await approvalEmailErrorMessage(error));
  return data ?? { sent: false, count: 0 };
}

export function sendPendingApprovalEmail(userId: string) {
  return sendApprovalEmail(userId, "pending");
}

export function sendMemberApprovedEmail(userId: string) {
  return sendApprovalEmail(userId, "approved");
}
