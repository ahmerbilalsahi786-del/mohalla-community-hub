import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, AlertTriangle, Flame, Zap, Droplets, HelpCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, React.ElementType> = {
  theft: ShieldAlert,
  suspicious: AlertTriangle,
  emergency: Flame,
  power_outage: Zap,
  water_shortage: Droplets,
  other: HelpCircle,
};

const SEVERITY: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: "bg-red-500/10", text: "text-red-600", dot: "bg-red-500" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-700", dot: "bg-amber-400" },
  low: { bg: "bg-green-500/10", text: "text-green-700", dot: "bg-green-500" },
};

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function SafetyWidget() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["safety-alerts-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_alerts")
        .select("id, title, alert_type, severity, location, is_resolved, created_at")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const latest = alerts[0];
  const count = alerts.length;

  return (
    <Link to="/safety">
      <div className="group cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", count > 0 ? "bg-red-500/10" : "bg-green-500/10")}>
              <ShieldAlert size={18} className={count > 0 ? "text-red-500" : "text-green-600"} />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Safety</h3>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        {isLoading ? (
          <div className="h-8 rounded-lg bg-muted animate-pulse" />
        ) : count === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 size={16} />
            <span className="font-medium">All clear</span>
            <span className="text-muted-foreground">· No active alerts</span>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{count}</span>
              <span className="text-sm font-medium text-foreground">active alert{count !== 1 ? "s" : ""}</span>
            </div>
            {latest && (() => {
              const TypeIcon = TYPE_ICON[latest.alert_type] || HelpCircle;
              const sev = SEVERITY[latest.severity] || SEVERITY.medium;
              return (
                <div className={cn("flex items-start gap-2 rounded-xl p-2.5", sev.bg)}>
                  <div className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", sev.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold truncate", sev.text)}>{latest.title}</p>
                    {latest.location && <p className="text-xs text-muted-foreground truncate mt-0.5">{latest.location}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(latest.created_at)}</p>
                  </div>
                  <TypeIcon size={14} className={cn("shrink-0 mt-0.5", sev.text)} />
                </div>
              );
            })()}
          </>
        )}
      </div>
    </Link>
  );
}
