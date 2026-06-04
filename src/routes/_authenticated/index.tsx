import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Home — Mohalla" },
      { name: "description", content: "Your Mohalla community hub." },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, display_name, unit_number, is_verified")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">م</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Mohalla</p>
              <h1 className="text-lg font-semibold">Community Hub</h1>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <h2 className="mt-1 text-2xl font-bold">
            {isLoading ? "…" : profile?.full_name || profile?.display_name || user.email}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          {profile?.unit_number && (
            <p className="mt-1 text-sm text-muted-foreground">Unit {profile.unit_number}</p>
          )}

          <div className="mt-4">
            {profile?.is_verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified member
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Awaiting admin verification
              </span>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Authentication is wired up. Community feed, marketplace, and the rest of the app are coming next.
        </p>
      </section>
    </main>
  );
}
