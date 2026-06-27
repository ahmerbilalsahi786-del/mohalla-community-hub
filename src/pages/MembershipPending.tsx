import { useEffect } from "react";
import { useLocation } from "wouter";
import { Clock3, LogOut, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    ? "Community suspended"
    : communityRejected
      ? "Community not approved"
      : communityPending
        ? "Community approval pending"
        : rejected
          ? "Membership not approved"
          : "Approval pending";
  const message = communitySuspended
    ? "This community has been suspended. Contact Mohalla support."
    : communityRejected
      ? `Your community ${community?.name ? `'${community.name}'` : "request"} was not approved.${community?.rejectionReason ? ` Reason: ${community.rejectionReason}` : ""}`
      : communityPending
        ? `Your community ${community?.name ? `'${community.name}'` : "request"} is awaiting approval from Mohalla. We'll notify you once it's reviewed.`
        : rejected
          ? "Your community administrator did not approve this membership. Contact them if this appears incorrect."
          : "Your account is ready. A community administrator needs to approve your membership before community content becomes available.";

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
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${blocked ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>
          {blocked ? <XCircle size={24} /> : <Clock3 size={24} />}
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} />
          Signed in as {user?.email}
        </div>
        <Button type="button" className="mt-6 w-full" onClick={refreshStatus} disabled={isFetching}>
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          {isFetching ? "Checking..." : "Check approval status"}
        </Button>
        <Button type="button" variant="outline" className="mt-3 w-full" onClick={logout}>
          <LogOut size={16} />
          Sign out
        </Button>
      </section>
    </main>
  );
}
