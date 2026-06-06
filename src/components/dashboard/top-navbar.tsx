import { useCallback, useState } from "react";
import { Search, Sun, Moon, Plus, ChevronDown, LogOut, Bell } from "lucide-react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Welcome back to your community" },
  "/feed": { title: "Community Feed", subtitle: "Stay connected with your neighbors" },
  "/events": { title: "Events", subtitle: "Upcoming community events" },
  "/polls": { title: "Polls", subtitle: "Vote and share your opinion" },
  "/community": { title: "Community", subtitle: "Your mohalla members" },
  "/announcements": { title: "Announcements", subtitle: "Important updates" },
  "/marketplace": { title: "Marketplace", subtitle: "Buy, sell and give away within the community" },
  "/safety": { title: "Safety & Alerts", subtitle: "Community safety reports and alerts" },
  "/settings": { title: "Settings", subtitle: "Manage your preferences and account" },
  "/admin": { title: "Admin Panel", subtitle: "Manage your community" },
  "/places": { title: "Places", subtitle: "Nearby places of interest" },
  "/volunteer": { title: "Volunteer", subtitle: "Give back to the community" },
  "/help": { title: "Help", subtitle: "Support & resources" },
  "/profile": { title: "Profile", subtitle: "Your account" },
};

function matchPageMeta(pathname: string) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/marketplace/")) return { title: "Listing Detail", subtitle: "Buy & Sell Marketplace" };
  if (pathname.startsWith("/admin")) return { title: "Admin Panel", subtitle: "Manage your community" };
  return { title: "Mohalla", subtitle: "Community Hub" };
}

export function TopNavbar() {
  const [darkMode, setDarkMode] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const meta = matchPageMeta(pathname);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setDarkMode((d) => !d);
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate({ to: "/auth", replace: true });
  }, [navigate, qc, toast]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex flex-col min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{meta.title}</h1>
        <p className="hidden sm:block text-sm text-muted-foreground truncate">{meta.subtitle}</p>
      </div>

      <div className="hidden flex-1 justify-center px-8 lg:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search community, events, people..."
            className="w-full h-10 rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={() => navigate({ to: "/feed" })}
          className="hidden gap-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 sm:flex"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Button>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell size={20} />
        </button>

        <button
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={handleSignOut}
          className="hidden sm:flex items-center gap-2 rounded-xl bg-muted/50 py-2 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
