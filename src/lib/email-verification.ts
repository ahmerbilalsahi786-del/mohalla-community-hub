import { supabase } from "@/integrations/supabase/client";

export type EmailVerificationResult = {
  sent?: boolean;
  verified?: boolean;
  throttled?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

async function functionErrorMessage(error: unknown) {
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

  return error instanceof Error ? error.message : "Email verification failed.";
}

export async function sendEmailVerification(input: { userId?: string; email: string }) {
  const { data, error } = await supabase.functions.invoke<EmailVerificationResult>("email-verification", {
    body: {
      action: "send",
      userId: input.userId,
      email: input.email,
    },
  });

  if (error) throw new Error(await functionErrorMessage(error));
  if (data?.error) throw new Error(data.error);
  return data ?? { sent: false };
}

export async function verifyEmailToken(input: { userId: string; token: string }) {
  const { data, error } = await supabase.functions.invoke<EmailVerificationResult>("email-verification", {
    body: {
      action: "verify",
      userId: input.userId,
      token: input.token,
    },
  });

  if (error) throw new Error(await functionErrorMessage(error));
  if (data?.error) throw new Error(data.error);
  return data ?? { verified: false };
}

export async function hasVerifiedMohallaEmail(userId: string) {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("email_verified_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.email_verified_at);
}

export function verificationPath(email: string) {
  const params = new URLSearchParams();
  if (email.trim()) params.set("email", email.trim());
  return `/verify-email${params.toString() ? `?${params.toString()}` : ""}`;
}
