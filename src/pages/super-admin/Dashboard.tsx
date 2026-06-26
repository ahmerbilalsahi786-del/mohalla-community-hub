import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, ShoppingBag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SuperAdminLayout } from "./SuperAdminLayout";
import { fetchPlatformDashboard, PlatformCommunity } from "./platform-api";

function StatusCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["platform-dashboard"], queryFn: fetchPlatformDashboard });
  const recent = data?.communities.slice(0, 10) ?? [];

  return (
    <SuperAdminLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review society registrations and platform activity.</p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/super-admin/communities">Review communities</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatusCard label="Pending" value={data?.counts.pending ?? 0} tone="text-amber-600" />
            <StatusCard label="Approved" value={data?.counts.approved ?? 0} tone="text-green-600" />
            <StatusCard label="Rejected" value={data?.counts.rejected ?? 0} tone="text-destructive" />
            <StatusCard label="Suspended" value={data?.counts.suspended ?? 0} tone="text-orange-600" />
            <StatusCard label="Total" value={data?.counts.all ?? 0} tone="text-foreground" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Total users", value: data?.totalUsers ?? 0, icon: Users },
              { label: "Total posts", value: data?.totalPosts ?? 0, icon: FileText },
              { label: "Total listings", value: data?.totalListings ?? 0, icon: ShoppingBag },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-semibold text-foreground">Recent registration requests</h2>
                <p className="text-sm text-muted-foreground">Latest societies submitted to Mohalla.</p>
              </div>
              {(data?.counts.pending ?? 0) > 0 && <Badge className="bg-amber-500 text-white">Urgent</Badge>}
            </div>
            {recent.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No community requests yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((community: PlatformCommunity) => (
                  <Link key={community.id} href={`/super-admin/communities/${community.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{community.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{community.area || "Area not set"} · {community.city || "City not set"}</p>
                    </div>
                    <Badge variant={community.status === "approved" ? "default" : "secondary"}>{community.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </SuperAdminLayout>
  );
}
