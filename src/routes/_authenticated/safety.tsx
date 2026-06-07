import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Plus, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Route as AuthLayout } from "@/routes/_authenticated/route";

type AlertType = "general" | "theft" | "accident" | "fire" | "medical";
type Severity = "low" | "medium" | "high";

interface Alert {
  id: string;
  user_id: string;
  title: string;
  description: string;
  severity: Severity;
  alert_type: AlertType;
  location: string | null;
  is_resolved: boolean;
  created_at: string;
}

const SEV: Record<Severity, { label: string; cls: string }> = {
  low: { label: "Low", cls: "bg-emerald-500/10 text-emerald-700" },
  medium: { label: "Medium", cls: "bg-amber-500/10 text-amber-700" },
  high: { label: "High", cls: "bg-red-500/10 text-red-600" },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function CreateAlertModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("general");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [location, setLocation] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("safety_alerts").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        alert_type: alertType,
        severity,
        location: location.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Could not report alert", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold">Report Safety Alert</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Type</label>
            <select value={alertType} onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
              <option value="general">General</option>
              <option value="theft">Theft</option>
              <option value="accident">Accident</option>
              <option value="fire">Fire</option>
              <option value="medical">Medical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as Severity[]).map((s) => (
                <button key={s} onClick={() => setSeverity(s)}
                  className={cn("rounded-xl py-2 text-sm font-medium border",
                    severity === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {SEV[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Location (optional)</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Block A"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()}
            disabled={title.trim().length < 3 || description.trim().length < 5 || create.isPending}>
            {create.isPending ? "Reporting…" : "Report Alert"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SafetyPage() {
  const { user } = AuthLayout.useRouteContext();
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ["alerts"],
    queryFn: async (): Promise<Alert[]> => {
      const { data, error } = await supabase.from("safety_alerts")
        .select("*").order("is_resolved", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Alert[]) ?? [];
    },
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("safety_alerts").update({ is_resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
    onError: (e: Error) => toast({ title: "Could not resolve", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Safety & Alerts</h2>
            <p className="text-sm text-muted-foreground">Report incidents and keep neighbors informed.</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-1.5" />Report</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive">{(error as Error).message}</div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert size={40} className="text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold">No alerts reported</h3>
          <p className="text-sm text-muted-foreground mt-1">Be the first to report a safety concern.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className={cn("rounded-2xl border border-border bg-card p-4", a.is_resolved && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", SEV[a.severity].cls)}>{SEV[a.severity].label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{a.alert_type}</span>
                    {a.is_resolved && <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-xs font-semibold inline-flex items-center gap-1"><CheckCircle2 size={11} /> Resolved</span>}
                  </div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {a.location ? `${a.location} · ` : ""}{timeAgo(a.created_at)}
                  </p>
                </div>
                {!a.is_resolved && a.user_id === user.id && (
                  <Button size="sm" variant="outline" onClick={() => resolve.mutate(a.id)} disabled={resolve.isPending}>
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateAlertModal onClose={() => setShowCreate(false)} userId={user.id} />}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/safety")({
  head: () => ({ meta: [{ title: "Safety & Alerts — Mohalla" }, { name: "description", content: "Community safety reports and alerts." }] }),
  component: SafetyPage,
});
