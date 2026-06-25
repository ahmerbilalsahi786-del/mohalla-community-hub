import { Clock3, LogOut, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/hooks/use-current-user";

export default function MembershipPending() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const rejected = user?.membershipStatus === "rejected";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${rejected ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"}`}>
          {rejected ? <XCircle size={24} /> : <Clock3 size={24} />}
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          {rejected ? "Membership not approved" : "Approval pending"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? "Your community administrator did not approve this membership. Contact them if this appears incorrect."
            : "Your account is ready. A community administrator needs to approve your membership before community content becomes available."}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} />
          Signed in as {user?.email}
        </div>
        <Button type="button" variant="outline" className="mt-6 w-full" onClick={logout}>
          <LogOut size={16} />
          Sign out
        </Button>
      </section>
    </main>
  );
}
