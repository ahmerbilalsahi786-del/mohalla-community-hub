import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Flag, ShieldCheck, XCircle } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getUser } from "@/lib/auth";
const extendedDb = supabase as any;

const STATUS_STYLE: Record<string, string> = {
  open: "bg-red-500/10 text-red-700",
  reviewing: "bg-amber-500/10 text-amber-700",
  resolved: "bg-green-500/10 text-green-700",
  dismissed: "bg-muted text-muted-foreground",
};

export default function AdminModeration() {
  const queryClient = useQueryClient();
  const demo = getUser()?.userId === "ahmed" && getUser()?.email === "demo@mohalla.app";
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-moderation-reports"],
    enabled: !demo,
    queryFn: async () => {
      const { data, error } = await extendedDb.from("moderation_reports").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: audit = [] } = useQuery({
    queryKey: ["admin-audit-log"],
    enabled: !demo,
    queryFn: async () => {
      const { data, error } = await extendedDb.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
  const updateReport = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await (supabase as any).rpc("admin_update_report", {
        target_report: reportId,
        requested_status: status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit-log"] });
    },
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-7">
        <div>
          <h2 className="text-xl font-bold">Moderation</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Review member reports and administrator actions</p>
        </div>

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Flag size={16} /> Reports</h3>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {isLoading ? (
              <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-md bg-muted" />)}</div>
            ) : reports.length === 0 ? (
              <div className="py-14 text-center">
                <CheckCircle2 size={28} className="mx-auto text-green-600" />
                <p className="mt-2 font-medium">No reports need attention</p>
              </div>
            ) : reports.map((report: any) => (
              <article key={report.id} className="border-b border-border p-4 last:border-b-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold capitalize">{report.target_type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[report.status] ?? STATUS_STYLE.open}`}>{report.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{report.reason}</p>
                    {report.details && <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">Target {report.target_id} · {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {report.status === "open" && <Button size="sm" variant="outline" onClick={() => updateReport.mutate({ reportId: report.id, status: "reviewing" })}><Clock3 size={14} /> Review</Button>}
                    {!["resolved", "dismissed"].includes(report.status) && <Button size="sm" onClick={() => updateReport.mutate({ reportId: report.id, status: "resolved" })}><ShieldCheck size={14} /> Resolve</Button>}
                    {!["resolved", "dismissed"].includes(report.status) && <Button size="sm" variant="ghost" onClick={() => updateReport.mutate({ reportId: report.id, status: "dismissed" })}><XCircle size={14} /> Dismiss</Button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Recent administrator activity</h3>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {audit.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No administrator actions recorded yet.</p> : audit.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-b-0">
                <span><strong className="capitalize">{entry.action.replaceAll("_", " ")}</strong> {entry.target_type}{entry.target_id ? ` ${entry.target_id}` : ""}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
