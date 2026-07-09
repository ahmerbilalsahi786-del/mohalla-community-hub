import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MohallaBrandLink } from "@/components/brand/mohalla-brand";
import { useCurrentUser, useLogout } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";

export default function MembershipPending() {
  const [, navigate] = useLocation();
  const { data: user, refetch, isFetching } = useCurrentUser();
  const logout = useLogout();
  const rejected = user?.membershipStatus === "rejected";
  const community = user?.community;
  const communityPending = user?.communityStatus === "pending";
  const communityRejected = user?.communityStatus === "rejected";
  const communitySuspended = user?.communityStatus === "suspended";
  const blocked = rejected || communityRejected || communitySuspended;
  const title = communitySuspended
    ? "Community Suspended"
    : communityRejected
      ? "Community Not Approved"
      : communityPending
        ? "Community Approval Pending"
        : rejected
          ? "Membership Not Approved"
          : "Approval Pending";
  const message = communitySuspended
    ? "This community has been suspended. Contact Mohalla support."
    : communityRejected
      ? `Your community ${community?.name ? `'${community.name}'` : "request"} was not approved.${community?.rejectionReason ? ` Reason: ${community.rejectionReason}` : ""}`
      : communityPending
        ? `Your community ${community?.name ? `'${community.name}'` : "request"} is awaiting approval from Mohalla. We'll notify you once it's reviewed.`
        : rejected
          ? "Your community administrator did not approve this membership. Contact them if this appears incorrect."
          : "Your account is ready. A community administrator needs to approve your membership before community content becomes available.";
  const statusIcon = blocked ? XCircle : communityPending ? Building2 : Clock3;
  const StatusIcon = statusIcon;

  const refreshStatus = async () => {
    await supabase.auth.refreshSession();
    const result = await refetch();
    if (result.data?.communityStatus === "approved" && result.data?.membershipStatus === "approved") {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    if (user?.communityStatus === "approved" && user?.membershipStatus === "approved") {
      navigate("/dashboard");
      return;
    }

    const timer = window.setInterval(() => {
      refreshStatus();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [navigate, refetch, user?.communityStatus, user?.membershipStatus]);

  return (
    <main className="mohalla-auth-shell relative min-h-screen overflow-hidden bg-gradient-to-b from-accent/25 via-background to-background px-4 py-8">
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center">
        <MohallaBrandLink className="mb-8" markClassName="rounded-2xl shadow-lg shadow-primary/20" />

        <section className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-border bg-white/90 shadow-2xl shadow-primary/5 backdrop-blur-xl">
          <div className={`p-7 text-center sm:p-9 ${blocked ? "bg-destructive/5" : "bg-primary/5"}`}>
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${
              blocked ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
            }`}>
              <StatusIcon size={30} />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-wide text-muted-foreground">
              {blocked ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> : <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
              Verification Status
            </div>
            <h1 className="mt-4 font-headings text-3xl font-black text-foreground sm:text-4xl">{title}</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{message}</p>
          </div>

          <div className="grid divide-y divide-border p-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:p-6">
            <div className="py-4 sm:px-4 sm:py-0">
              <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-black text-foreground">Signed In</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="py-4 sm:px-4 sm:py-0">
              <Building2 className="mb-3 h-5 w-5 text-accent" />
              <p className="text-sm font-black text-foreground">Community</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{community?.name ?? "Awaiting setup"}</p>
            </div>
            <div className="py-4 sm:px-4 sm:py-0">
              <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" />
              <p className="text-sm font-black text-foreground">Next Step</p>
              <p className="mt-1 text-xs text-muted-foreground">{blocked ? "Contact support" : "Admin review"}</p>
            </div>
          </div>

          {!blocked && (
            <div className="px-5 pb-2 sm:px-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-black text-amber-900">We'll keep checking automatically.</p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800/80">
                      Once your approval is saved by the admin, this page will move you into the dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:p-6">
            <Button type="button" size="lg" className="h-12 flex-1 rounded-2xl font-black shadow-lg shadow-primary/15" onClick={refreshStatus} disabled={isFetching}>
              <RefreshCw size={17} className={isFetching ? "animate-spin" : ""} />
              {isFetching ? "Checking..." : "Check Approval Status"}
            </Button>
            <Button type="button" size="lg" variant="outline" className="h-12 flex-1 rounded-2xl font-black" onClick={logout}>
              <LogOut size={17} />
              Sign Out
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
