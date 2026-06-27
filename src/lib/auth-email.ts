import { supabase } from "@/integrations/supabase/client";

const RESENDABLE_CONFIRMATION_ERRORS = [
  "already registered",
  "already exists",
  "already been registered",
  "email not confirmed",
  "confirm your email",
  "email confirmation",
];

export function shouldResendSignupConfirmation(message?: string | null) {
  const text = message?.toLowerCase() ?? "";
  return RESENDABLE_CONFIRMATION_ERRORS.some((item) => text.includes(item));
}

export async function resendSignupConfirmation(email: string, emailRedirectTo: string) {
  const address = email.trim();
  if (!address) throw new Error("Enter your email address first.");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: address,
    options: { emailRedirectTo },
  });

  if (error) throw error;
}
