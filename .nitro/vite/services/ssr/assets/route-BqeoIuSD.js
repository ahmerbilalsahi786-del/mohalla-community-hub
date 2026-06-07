import { O as useRouter, r as reactExports, W as jsxRuntimeExports, a2 as Outlet } from "./server-jgJDFZ6n.js";
import { L as Link, u as useNavigate, a as useQueryClient } from "./router-B2v70SHd.js";
import { c as cn, B as Button } from "./button-dmcdYm9w.js";
import { C as ChevronRight } from "./chevron-right-D3PNezEj.js";
import { c as createLucideIcon } from "./createLucideIcon-B-hS4TPQ.js";
import { M as MessageSquare, S as ShoppingBag } from "./shopping-bag-DIyZRV7i.js";
import { S as ShieldAlert } from "./shield-alert-D7jLGArE.js";
import { C as Calendar } from "./calendar-sc3siVdD.js";
import { C as ChartNoAxesColumn } from "./chart-no-axes-column-BK2Kn-yn.js";
import { U as Users } from "./users-CY8yiSVS.js";
import { M as Megaphone } from "./megaphone-DZqA26yn.js";
import { M as MapPin } from "./map-pin-DIEu5PUd.js";
import { H as Heart } from "./heart-vJnyNvDB.js";
import { S as ShieldCheck } from "./shield-check-DXYyfkrv.js";
import { S as Settings } from "./settings-BtD8UQWd.js";
import { C as CircleQuestionMark } from "./circle-question-mark-fFbwc8P2.js";
import { supabase } from "./client-CMfAcMyN.js";
import { u as useToast } from "./use-toast-BLjjwiW_.js";
import { S as Search } from "./search-DKCJPFVK.js";
import { P as Plus } from "./plus-B2pBjOns.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
function useRouterState(opts) {
  const contextRouter = useRouter({ warn: opts?.router === void 0 });
  const router = opts?.router || contextRouter;
  {
    const state = router.stores.__store.get();
    return opts?.select ? opts.select(state) : state;
  }
}
const __iconNode$5 = [
  ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
  [
    "path",
    {
      d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
      key: "11g9vi"
    }
  ]
];
const Bell = createLucideIcon("bell", __iconNode$5);
const __iconNode$4 = [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]];
const ChevronLeft = createLucideIcon("chevron-left", __iconNode$4);
const __iconNode$3 = [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "r6nss1"
    }
  ]
];
const House = createLucideIcon("house", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }]
];
const LogOut = createLucideIcon("log-out", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",
      key: "kfwtm"
    }
  ]
];
const Moon = createLucideIcon("moon", __iconNode$1);
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
  ["path", { d: "M12 2v2", key: "tus03m" }],
  ["path", { d: "M12 20v2", key: "1lh1kg" }],
  ["path", { d: "m4.93 4.93 1.41 1.41", key: "149t6j" }],
  ["path", { d: "m17.66 17.66 1.41 1.41", key: "ptbguv" }],
  ["path", { d: "M2 12h2", key: "1t8f8n" }],
  ["path", { d: "M20 12h2", key: "1q8mjw" }],
  ["path", { d: "m6.34 17.66-1.41 1.41", key: "1m8zz5" }],
  ["path", { d: "m19.07 4.93-1.41 1.41", key: "1shlcs" }]
];
const Sun = createLucideIcon("sun", __iconNode);
const navItems = [
  { name: "Dashboard", icon: House, href: "/", badge: null },
  { name: "Community Feed", icon: MessageSquare, href: "/feed", badge: null },
  { name: "Safety & Alerts", icon: ShieldAlert, href: "/safety", badge: null },
  { name: "Events", icon: Calendar, href: "/events", badge: null },
  { name: "Polls", icon: ChartNoAxesColumn, href: "/polls", badge: null },
  { name: "Community", icon: Users, href: "/community", badge: null },
  { name: "Announcements", icon: Megaphone, href: "/announcements", badge: null },
  { name: "Marketplace", icon: ShoppingBag, href: "/marketplace", badge: "New" },
  { name: "Places", icon: MapPin, href: "/places", badge: null },
  { name: "Volunteer", icon: Heart, href: "/volunteer", badge: null },
  { name: "Admin Panel", icon: ShieldCheck, href: "/admin", badge: null }
];
const bottomItems = [
  { name: "Settings", icon: Settings, href: "/settings" },
  { name: "Help", icon: CircleQuestionMark, href: "/help" }
];
function Sidebar() {
  const [collapsed, setCollapsed] = reactExports.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (href) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "aside",
    {
      className: cn(
        "relative hidden md:flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out sticky top-0 self-start overflow-hidden",
        collapsed ? "w-20" : "w-64"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-20 top-20 h-40 w-40 rounded-full bg-sidebar-primary/10 blur-3xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-10 bottom-40 h-32 w-32 rounded-full bg-accent/10 blur-2xl" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-16 items-center justify-between border-b border-sidebar-border px-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-sidebar-primary-foreground", children: "م" }) }),
            !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold tracking-tight", children: "Mohalla" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setCollapsed(!collapsed),
              className: "flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-accent/50 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              children: collapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 16 })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex-1 space-y-1 overflow-y-auto p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50", collapsed && "sr-only"), children: "Main Menu" }),
          navItems.map((item) => {
            const active = isActive(item.href);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: item.href,
                className: cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                ),
                children: [
                  active && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    item.icon,
                    {
                      size: 20,
                      className: cn(
                        "shrink-0 transition-colors",
                        active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                      )
                    }
                  ),
                  !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: item.name }),
                    item.badge && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          item.badge === "New" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent text-sidebar-accent-foreground"
                        ),
                        children: item.badge
                      }
                    )
                  ] })
                ]
              },
              item.name
            );
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-sidebar-border p-3 space-y-1", children: bottomItems.map((item) => {
          const active = isActive(item.href);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: item.href,
              className: cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { size: 20, className: "shrink-0" }),
                !collapsed && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: item.name })
              ]
            },
            item.name
          );
        }) })
      ]
    }
  );
}
const PAGE_META = {
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
  "/profile": { title: "Profile", subtitle: "Your account" }
};
function matchPageMeta(pathname) {
  if (PAGE_META[pathname]) return PAGE_META[pathname];
  if (pathname.startsWith("/marketplace/")) return { title: "Listing Detail", subtitle: "Buy & Sell Marketplace" };
  if (pathname.startsWith("/admin")) return { title: "Admin Panel", subtitle: "Manage your community" };
  return { title: "Mohalla", subtitle: "Community Hub" };
}
function TopNavbar() {
  const [darkMode, setDarkMode] = reactExports.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const meta = matchPageMeta(pathname);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const toggleDarkMode = () => {
    setDarkMode((d) => !d);
    document.documentElement.classList.toggle("dark");
  };
  const handleSignOut = reactExports.useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate({ to: "/auth", replace: true });
  }, [navigate, qc, toast]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg sm:text-xl font-bold text-foreground truncate", children: meta.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "hidden sm:block text-sm text-muted-foreground truncate", children: meta.subtitle })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden flex-1 justify-center px-8 lg:flex", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          placeholder: "Search community, events, people...",
          className: "w-full h-10 rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: () => navigate({ to: "/feed" }),
          className: "hidden gap-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 sm:flex",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "New Post" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { size: 20 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: toggleDarkMode,
          className: "flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          children: darkMode ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { size: 20 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: handleSignOut,
          className: "hidden sm:flex items-center gap-2 rounded-xl bg-muted/50 py-2 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          title: "Sign out",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 16 })
        }
      )
    ] })
  ] });
}
const NAV = [
  { label: "Home", icon: House, href: "/" },
  { label: "Feed", icon: MessageSquare, href: "/feed" },
  { label: "Market", icon: ShoppingBag, href: "/marketplace" },
  { label: "Safety", icon: ShieldAlert, href: "/safety" },
  { label: "Events", icon: Calendar, href: "/events" }
];
function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-md md:hidden", children: NAV.map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: item.href, className: "flex flex-1 flex-col items-center justify-center gap-0.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-8 w-8 items-center justify-center rounded-xl transition-colors", active && "bg-primary/10"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 20, className: active ? "text-primary" : "text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground"), children: item.label })
    ] }, item.href);
  }) });
}
function DashboardShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen w-full bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none fixed inset-0 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-1 flex-col min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TopNavbar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6", children }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "hidden md:block border-t border-border bg-muted/20 px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-muted-foreground", children: "© 2026 Mohalla  ·  Made in Pakistan 🇵🇰" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MobileNav, {})
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
export {
  SplitComponent as component
};
