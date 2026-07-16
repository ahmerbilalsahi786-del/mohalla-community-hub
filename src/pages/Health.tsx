import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { checkHealth, getAppVersion, getLastDeployTime } from "@/lib/health";

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
  ) : (
    <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
  );
}

export default function Health() {
  const health = useQuery({
    queryKey: ["app-health"],
    queryFn: checkHealth,
    refetchOnWindowFocus: false,
  });

  const session = useQuery({
    queryKey: ["health-session-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    retry: false,
  });

  const data = health.data;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Admin/dev diagnostic</p>
            <h1 className="mt-1 text-3xl font-black text-foreground">Mohalla Health</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => health.refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-card-foreground">Connection status</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {health.isLoading ? "Checking app services..." : data?.ok ? "All required services are reachable." : "One or more services need attention."}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background p-4">
              <StatusIcon ok={Boolean(data?.supabaseConfigured)} />
              <p className="mt-2 text-sm font-bold">Supabase config</p>
              <p className="text-sm text-muted-foreground">{data?.supabaseConfigured ? "Set" : "Missing"}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <StatusIcon ok={Boolean(data?.supabaseReachable)} />
              <p className="mt-2 text-sm font-bold">Supabase read</p>
              <p className="text-sm text-muted-foreground">{data?.supabaseReachable ? "Reachable" : "Not reachable"}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <StatusIcon ok={data?.sessionStatus === "signed-in"} />
              <p className="mt-2 text-sm font-bold">Session</p>
              <p className="text-sm text-muted-foreground">{data?.sessionStatus ?? "Checking"}</p>
            </div>
          </div>
        </div>

        {data?.issues.length ? (
          <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-black">Issues</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {data.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-black text-card-foreground">Environment</h2>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {data?.environment.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-semibold text-foreground">{item.name}</span>
                <span className={item.isSet ? "text-sm font-bold text-primary" : "text-sm font-bold text-destructive"}>
                  {item.isSet ? "Set" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-bold text-muted-foreground">App version</p>
            <p className="mt-1 text-lg font-black text-card-foreground">{getAppVersion()}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-bold text-muted-foreground">Last deploy time</p>
            <p className="mt-1 text-lg font-black text-card-foreground">{getLastDeployTime()}</p>
          </div>
        </div>

        <p className="mt-5 text-sm text-muted-foreground">
          Signed-in user: {session.data?.email ?? "None"}
        </p>
      </section>
    </main>
  );
}
