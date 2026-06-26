import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, Eye, PauseCircle, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SuperAdminLayout } from "./SuperAdminLayout";
import { CommunityStatus, fetchPlatformCommunities, PlatformCommunity, updateCommunityStatus } from "./platform-api";

const tabs: Array<{ label: string; value: CommunityStatus | "all" }> = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Suspended", value: "suspended" },
  { label: "All", value: "all" },
];

type Action = "approved" | "rejected" | "suspended";

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "approved"
      ? "bg-green-600 text-white"
      : status === "pending"
        ? "bg-amber-500 text-white"
        : status === "suspended"
          ? "bg-orange-600 text-white"
          : "bg-destructive text-destructive-foreground";
  return <Badge className={className}>{status}</Badge>;
}

function nextActions(community: PlatformCommunity): Array<{ label: string; action: Action; icon: typeof CheckCircle2; variant?: "default" | "destructive" | "outline" }> {
  if (community.status === "pending") {
    return [
      { label: "Approve", action: "approved", icon: CheckCircle2 },
      { label: "Reject", action: "rejected", icon: XCircle, variant: "destructive" },
    ];
  }
  if (community.status === "approved") {
    return [{ label: "Suspend", action: "suspended", icon: PauseCircle, variant: "outline" }];
  }
  if (community.status === "suspended") {
    return [{ label: "Reactivate", action: "approved", icon: RotateCcw }];
  }
  return [];
}

export default function SuperAdminCommunities() {
  const [status, setStatus] = useState<CommunityStatus | "all">("pending");
  const [actionTarget, setActionTarget] = useState<{ community: PlatformCommunity; action: Action; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data = [], isLoading } = useQuery<PlatformCommunity[]>({
    queryKey: ["platform-communities", status],
    queryFn: () => fetchPlatformCommunities(status),
  });
  const requiresReason = actionTarget?.action === "rejected" || actionTarget?.action === "suspended";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actionTarget) return;
      await updateCommunityStatus(actionTarget.community.id, actionTarget.action, reason.trim() || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-communities"] });
      qc.invalidateQueries({ queryKey: ["platform-dashboard"] });
      toast({ title: "Community status updated" });
      setActionTarget(null);
      setReason("");
    },
  });

  const counts = useMemo(() => {
    return tabs.reduce<Record<string, number>>((acc, tab) => {
      acc[tab.value] = tab.value === "all" ? data.length : data.filter((community: PlatformCommunity) => community.status === tab.value).length;
      return acc;
    }, {});
  }, [data]);

  return (
    <SuperAdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Communities</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve, reject, suspend, and review societies across Mohalla.</p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            variant={status === tab.value ? "default" : "outline"}
            onClick={() => setStatus(tab.value)}
            className="shrink-0 rounded-xl"
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-background/20 px-2 text-xs">{counts[tab.value] ?? 0}</span>
          </Button>
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center"><Spinner /></div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="mx-auto mb-3 text-muted-foreground" size={32} />
            <p className="font-medium text-foreground">No communities found</p>
            <p className="mt-1 text-sm text-muted-foreground">New registration requests will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((community) => (
                  <tr key={community.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{community.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{community.city || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{community.area || "-"}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{community.adminName}</p>
                      <p className="text-xs text-muted-foreground">{community.adminEmail || "Email unavailable"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{community.memberCount}</td>
                    <td className="px-4 py-3"><StatusBadge status={community.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(community.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href={`/super-admin/communities/${community.id}`}><Eye size={15} /></Link>
                        </Button>
                        {nextActions(community).map(({ label, action, icon: Icon, variant }) => (
                          <Button
                            key={`${community.id}-${action}`}
                            size="sm"
                            variant={variant ?? "default"}
                            className="gap-1 rounded-xl"
                            onClick={() => setActionTarget({ community, action, label })}
                          >
                            <Icon size={15} />
                            {label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={Boolean(actionTarget)} onOpenChange={(open) => !open && setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionTarget?.label} community</DialogTitle>
            <DialogDescription>
              {requiresReason
                ? `Add a reason before you ${actionTarget?.label.toLowerCase()} ${actionTarget?.community.name}.`
                : `Confirm ${actionTarget?.community.name} can move to ${actionTarget?.action}.`}
            </DialogDescription>
          </DialogHeader>
          {requiresReason && (
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason"
              className="min-h-28"
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setActionTarget(null)}>Cancel</Button>
            <Button
              type="button"
              disabled={mutation.isPending || (requiresReason && !reason.trim())}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Spinner className="mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
