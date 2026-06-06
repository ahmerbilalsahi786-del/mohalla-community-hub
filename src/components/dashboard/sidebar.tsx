import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Home, Users, Calendar, MessageSquare, Settings, HelpCircle,
  ChevronLeft, ChevronRight, MapPin, Megaphone, ShoppingBag, Heart,
  ShieldAlert, ShieldCheck, BarChart2,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", icon: Home, href: "/", badge: null as string | null },
  { name: "Community Feed", icon: MessageSquare, href: "/feed", badge: null },
  { name: "Safety & Alerts", icon: ShieldAlert, href: "/safety", badge: null },
  { name: "Events", icon: Calendar, href: "/events", badge: null },
  { name: "Polls", icon: BarChart2, href: "/polls", badge: null },
  { name: "Community", icon: Users, href: "/community", badge: null },
  { name: "Announcements", icon: Megaphone, href: "/announcements", badge: null },
  { name: "Marketplace", icon: ShoppingBag, href: "/marketplace", badge: "New" },
  { name: "Places", icon: MapPin, href: "/places", badge: null },
  { name: "Volunteer", icon: Heart, href: "/volunteer", badge: null },
  { name: "Admin Panel", icon: ShieldCheck, href: "/admin", badge: null },
];

const bottomItems = [
  { name: "Settings", icon: Settings, href: "/settings" },
  { name: "Help", icon: HelpCircle, href: "/help" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "relative hidden md:flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out sticky top-0 self-start overflow-hidden",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="absolute -right-20 top-20 h-40 w-40 rounded-full bg-sidebar-primary/10 blur-3xl" />
      <div className="absolute -left-10 bottom-40 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <span className="text-lg font-bold text-sidebar-primary-foreground">م</span>
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-tight">Mohalla</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent/50 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className={cn("mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50", collapsed && "sr-only")}>
          Main Menu
        </div>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
              )}
              <item.icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground",
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        item.badge === "New"
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="flex-1">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
