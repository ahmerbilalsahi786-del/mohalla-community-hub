import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
          <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-black text-card-foreground">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Mohalla could not finish loading this screen. Refreshing usually fixes temporary connection issues.
            </p>
            {this.state.error && (
              <p className="mt-4 rounded-xl bg-muted p-3 text-left text-sm text-muted-foreground">
                {this.state.error}
              </p>
            )}
            <Button type="button" className="mt-5 w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload app
            </Button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
