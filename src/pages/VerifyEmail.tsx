import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, MailCheck, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MohallaBrandLink } from "@/components/brand/mohalla-brand";
import { useToast } from "@/hooks/use-toast";
import { sendEmailVerification, verifyEmailToken } from "@/lib/email-verification";

type VerificationState = "checking" | "ready" | "success" | "error";

export default function VerifyEmail() {
  const { toast } = useToast();
  const params = useMemo(
    () => new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""),
    [],
  );
  const userId = params.get("uid")?.trim() ?? "";
  const token = params.get("token")?.trim() ?? "";
  const [email, setEmail] = useState(params.get("email")?.trim() ?? "");
  const [state, setState] = useState<VerificationState>(userId && token ? "checking" : "ready");
  const [message, setMessage] = useState(
    userId && token
      ? "Checking your verification link..."
      : "Open the link we sent to your inbox before signing in.",
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!userId || !token) return;

    let active = true;
    verifyEmailToken({ userId, token })
      .then(() => {
        if (!active) return;
        setState("success");
        setMessage("Your email is confirmed. You can sign in now.");
      })
      .catch((error) => {
        if (!active) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "Verification link could not be confirmed.");
      });

    return () => {
      active = false;
    };
  }, [token, userId]);

  const resend = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email address first.", variant: "destructive" });
      return;
    }

    setResending(true);
    try {
      await sendEmailVerification({ email: email.trim() });
      toast({
        title: "Verification email sent",
        description: "Open the newest link in your inbox.",
      });
      setState("ready");
      setMessage("Open the newest verification link before signing in.");
    } catch (error) {
      toast({
        title: "Could not send verification email",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const StatusIcon = state === "success" ? CheckCircle2 : state === "error" ? XCircle : MailCheck;

  return (
    <main className="mohalla-auth-shell relative min-h-screen overflow-hidden bg-gradient-to-b from-accent/25 via-background to-background px-4 py-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center">
        <MohallaBrandLink className="mb-8" markClassName="rounded-2xl shadow-lg shadow-primary/20" />

        <section className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-border bg-white/90 shadow-2xl shadow-primary/5 backdrop-blur-xl">
          <div className={`p-7 text-center sm:p-9 ${state === "error" ? "bg-destructive/5" : "bg-primary/5"}`}>
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${
              state === "success"
                ? "bg-emerald-500/10 text-emerald-600"
                : state === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
            }`}>
              <StatusIcon size={30} />
            </div>
            <h1 className="mt-5 font-headings text-3xl font-black text-foreground sm:text-4xl">
              {state === "success" ? "Email Confirmed" : "Verify Your Email"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {message}
            </p>
          </div>

          {state !== "success" && (
            <div className="space-y-4 p-5 sm:p-6">
              <div className="space-y-1.5">
                <label htmlFor="verify-email" className="text-sm font-bold text-foreground">Email</label>
                <Input
                  id="verify-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-2xl bg-white px-4"
                />
              </div>
              <Button type="button" size="lg" className="h-12 w-full rounded-2xl font-black" onClick={resend} disabled={resending || state === "checking"}>
                <RefreshCw size={17} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending..." : "Send Verification Email"}
              </Button>
            </div>
          )}

          <div className="border-t border-border p-5 text-center sm:p-6">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm font-black text-primary hover:underline">
              Go to sign in <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
