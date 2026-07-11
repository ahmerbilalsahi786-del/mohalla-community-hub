import { useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { dismissInstallPrompt, useInstallPrompt } from "@/hooks/use-install-prompt";

type InstallAppButtonProps = {
  collapsed?: boolean;
  className?: string;
  variant?: "sidebar" | "mobile" | "floating" | "landing";
};

function useInstallAction() {
  const install = useInstallPrompt();
  const { toast } = useToast();

  const runInstall = async () => {
    const outcome = await install.promptInstall();
    if (outcome === "unavailable") {
      toast({
        title: "Install Mohalla",
        description: "Add it from your browser menu when the install option appears.",
      });
      return;
    }

    if (outcome === "accepted") {
      toast({ title: "Mohalla is installing" });
    }
  };

  return { install, runInstall };
}

export function InstallAppButton({ collapsed, className, variant = "sidebar" }: InstallAppButtonProps) {
  const { install, runInstall } = useInstallAction();
  const showFallback = !install.installed && !install.standalone;

  if (!install.isInstallable && !showFallback) return null;

  if (variant === "floating") {
    return (
      <button
        type="button"
        onClick={runInstall}
        className={cn(
          "fixed right-4 top-4 z-50 flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground shadow-md",
          className,
        )}
      >
        <Download size={17} />
        Install App
      </button>
    );
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={runInstall}
        className={cn("flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3", className)}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download size={16} />
        </div>
        <span className="text-sm font-medium text-foreground">Install App</span>
      </button>
    );
  }

  if (variant === "landing") {
    return (
      <button
        type="button"
        onClick={runInstall}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 text-sm font-bold text-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card",
          className,
        )}
      >
        <Download size={17} />
        Install Mohalla App
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={runInstall}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        collapsed && "justify-center",
        className,
      )}
      aria-label="Install Mohalla"
      title="Install Mohalla"
    >
      <Download size={20} className="shrink-0" />
      {!collapsed && <span className="flex-1 text-left">Install App</span>}
    </button>
  );
}

export function InstallAppPrompt() {
  const { install, runInstall } = useInstallAction();
  const [hidden, setHidden] = useState(false);

  if (!install.isInstallable || install.dismissed || hidden) return null;

  const dismiss = () => {
    setHidden(true);
    dismissInstallPrompt();
  };

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-3 shadow-xl md:bottom-5 md:right-5 md:left-auto">
      <div className="flex items-center gap-3">
        <img src="/pwa-192.png" alt="" className="h-11 w-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-card-foreground">Install Mohalla</p>
          <p className="truncate text-xs text-muted-foreground">Open your community from your home screen.</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X size={16} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" onClick={runInstall} className="h-9 flex-1 rounded-xl">
          <Download size={16} />
          Install
        </Button>
        <Button type="button" variant="ghost" onClick={dismiss} className="h-9 rounded-xl">
          Not now
        </Button>
      </div>
    </div>
  );
}
