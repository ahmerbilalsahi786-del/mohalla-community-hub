import { Link, useLocation } from "wouter";
import { Building2, Gauge, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: Gauge },
  { label: "Communities", href: "/super-admin/communities", icon: Building2 },
];

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/super-admin/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck size={20} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mohalla</span>
              <span className="block truncate text-lg font-bold text-foreground">Platform Owner</span>
            </span>
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={logout} className="gap-2 rounded-xl">
            <LogOut size={16} />
            Sign out
          </Button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location === tab.href || (tab.href !== "/super-admin/dashboard" && location.startsWith(tab.href));
            return (
              <Link key={tab.href} href={tab.href}>
                <span
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                    active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
