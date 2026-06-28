import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clearToken, setToken } from "@/lib/auth";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const prepareRecoverySession = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const type = hash.get("type") || url.searchParams.get("type");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session?.access_token) setToken(data.session.access_token);
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (data.session?.access_token) setToken(data.session.access_token);
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session?.access_token) {
            throw new Error("Open the password reset link from your email again.");
          }
          setToken(data.session.access_token);
        }

        if (type && type !== "recovery") {
          throw new Error("This link is not a password reset link.");
        }

        window.history.replaceState(null, "", "/reset-password");
        if (active) setReady(true);
      } catch (error) {
        if (!active) return;
        toast({
          title: "Reset link is not ready",
          description: error instanceof Error ? error.message : "Please request a new reset email.",
          variant: "destructive",
        });
        setReady(false);
      } finally {
        if (active) setCheckingLink(false);
      }
    };

    void prepareRecoverySession();

    return () => {
      active = false;
    };
  }, [toast]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) {
      toast({ title: "Open the reset link from your email first.", variant: "destructive" });
      return;
    }
    if (password.length < 12) {
      toast({ title: "Use at least 12 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
      return;
    }
    if (data.user) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) setToken(sessionData.session.access_token);
    }
    toast({ title: "Password updated", description: "You can now sign in with your new password." });
    await supabase.auth.signOut();
    clearToken();
    navigate("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <KeyRound size={22} />
          </div>
          <h1 className="mt-3 text-2xl font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use at least 12 characters.</p>
        </div>
        {checkingLink ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Checking reset link...
          </div>
        ) : !ready ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
            <p className="text-sm font-medium text-foreground">This reset link could not be opened.</p>
            <p className="mt-1 text-xs text-muted-foreground">Request a fresh link from the sign-in page.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-sm font-medium">New password</label>
              <div className="relative">
                <Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required className="pr-10" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</label>
              <Input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
