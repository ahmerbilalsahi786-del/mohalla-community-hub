import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, MessageSquare, Heart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityCard, type Activity } from "@/components/dashboard/activity-card";
import { EventCard, type DashboardEvent } from "@/components/dashboard/event-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { MemberCard, type Member } from "@/components/dashboard/member-card";
import { SafetyWidget } from "@/components/dashboard/safety-widget";
import { Route as AuthLayout } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mohalla" },
      { name: "description", content: "Your Mohalla community at a glance." },
    ],
  }),
  component: Dashboard,
});

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Dashboard() {
  const { user } = AuthLayout.useRouteContext();

  const { data: myProfile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("full_name, display_name, unit_number")
        .eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [members, events, posts, alerts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true })
          .gte("starts_at", new Date().toISOString()),
        supabase.from("posts").select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
        supabase.from("safety_alerts").select("id", { count: "exact", head: true })
          .eq("is_resolved", false),
      ]);
      return {
        members: members.count ?? 0,
        events: events.count ?? 0,
        posts: posts.count ?? 0,
        alerts: alerts.count ?? 0,
      };
    },
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ["recent-posts"],
    queryFn: async (): Promise<Activity[]> => {
      const { data } = await supabase
        .from("posts")
        .select("id, title, type, created_at, profiles:user_id(full_name, display_name)")
        .order("created_at", { ascending: false })
        .limit(5);
      return ((data ?? []) as any[]).map((p) => ({
        id: p.id,
        user: p.profiles?.full_name || p.profiles?.display_name || "Resident",
        action: p.type === "announcement" ? "posted an announcement" : "posted in",
        target: p.title,
        time: timeAgo(p.created_at),
        type: p.type === "event" ? "event" : "post",
      }));
    },
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["upcoming-events-dashboard"],
    queryFn: async (): Promise<DashboardEvent[]> => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, starts_at, location, rsvp_count, category, max_attendees")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5);
      return ((data ?? []) as any[]).map((e) => {
        const dt = new Date(e.starts_at);
        return {
          id: e.id,
          title: e.title,
          description: e.description ?? "",
          date: dt.toISOString().slice(0, 10),
          time: dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          location: e.location ?? "TBA",
          attendees: e.rsvp_count ?? 0,
          maxAttendees: e.max_attendees ?? undefined,
          category: e.category ?? "Community",
        };
      });
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["recent-members"],
    queryFn: async (): Promise<Member[]> => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, display_name, unit_number, is_verified, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      return ((data ?? []) as any[]).map((p) => ({
        id: p.id,
        name: p.full_name || p.display_name || "Resident",
        role: p.is_verified ? "Verified Resident" : p.unit_number ? `Unit ${p.unit_number}` : "New Member",
        isOnline: false,
      }));
    },
  });

  const greetName = (myProfile?.full_name || myProfile?.display_name || user.email?.split("@")[0] || "Neighbor").split(" ")[0];
  const featured = upcoming.slice(0, 2);
  const compact = upcoming.slice(2);

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Assalam-o-Alaikum, {greetName}!</h2>
            <p className="text-muted-foreground">Here&apos;s what&apos;s happening in your mohalla today</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Community Members" value={stats?.members ?? "—"} icon={Users}
          iconColor="bg-primary/10 text-primary" description="verified residents" />
        <StatCard title="Upcoming Events" value={stats?.events ?? "—"} icon={Calendar}
          iconColor="bg-accent/10 text-accent" description="this week & beyond" />
        <StatCard title="Posts This Week" value={stats?.posts ?? "—"} icon={MessageSquare}
          iconColor="bg-amber-500/10 text-amber-600" description="community activity" />
        <StatCard title="Active Alerts" value={stats?.alerts ?? "—"} icon={Heart}
          iconColor="bg-pink-500/10 text-pink-600" description="needs attention" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Upcoming Events</h3>
            </div>
            {featured.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No upcoming events yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {featured.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
            )}
          </div>

          {compact.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">More This Week</h4>
              {compact.map((event) => <EventCard key={event.id} event={event} variant="compact" />)}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <SafetyWidget />
          <QuickActions />
          <ActivityCard activities={recentPosts} />
          <MemberCard members={members} />
        </div>
      </div>
    </>
  );
}
