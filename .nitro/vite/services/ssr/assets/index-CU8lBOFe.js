import { W as jsxRuntimeExports } from "./server-jgJDFZ6n.js";
import { u as useQuery } from "./useQuery-CX4ajZb6.js";
import { supabase } from "./client-CMfAcMyN.js";
import { c as cn, B as Button } from "./button-dmcdYm9w.js";
import { M as MapPin } from "./map-pin-DIEu5PUd.js";
import { U as Users } from "./users-CY8yiSVS.js";
import { C as Calendar } from "./calendar-sc3siVdD.js";
import { u as useNavigate, L as Link, R as Route } from "./router-B2v70SHd.js";
import { P as Plus } from "./plus-B2pBjOns.js";
import { M as Megaphone } from "./megaphone-DZqA26yn.js";
import { S as ShoppingBag, M as MessageSquare } from "./shopping-bag-DIyZRV7i.js";
import { U as UserPlus } from "./user-plus-BoJybFN4.js";
import { S as ShieldAlert } from "./shield-alert-D7jLGArE.js";
import { C as ChevronRight } from "./chevron-right-D3PNezEj.js";
import { C as CircleCheck } from "./circle-check-D3eWA9s5.js";
import { C as CircleQuestionMark } from "./circle-question-mark-fFbwc8P2.js";
import { c as createLucideIcon } from "./createLucideIcon-B-hS4TPQ.js";
import { H as Heart } from "./heart-vJnyNvDB.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const __iconNode$4 = [
  [
    "path",
    {
      d: "M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z",
      key: "1ptgy4"
    }
  ],
  [
    "path",
    {
      d: "M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97",
      key: "1sl1rz"
    }
  ]
];
const Droplets = createLucideIcon("droplets", __iconNode$4);
const __iconNode$3 = [
  [
    "path",
    {
      d: "M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",
      key: "1slcih"
    }
  ]
];
const Flame = createLucideIcon("flame", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "M16 7h6v6", key: "box55l" }],
  ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }]
];
const TrendingUp = createLucideIcon("trending-up", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
const TriangleAlert = createLucideIcon("triangle-alert", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
      key: "1xq2db"
    }
  ]
];
const Zap = createLucideIcon("zap", __iconNode);
function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  description
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-primary/5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-muted-foreground", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-3xl font-bold tracking-tight text-card-foreground", children: value }),
        change && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn(
            "text-sm font-semibold",
            changeType === "positive" && "text-green-600",
            changeType === "negative" && "text-destructive",
            changeType === "neutral" && "text-muted-foreground"
          ), children: change }),
          description && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-12 w-12 items-center justify-center rounded-xl", iconColor), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 24 }) })
    ] })
  ] });
}
const typeColors = {
  event: "bg-accent text-accent-foreground",
  post: "bg-primary text-primary-foreground",
  join: "bg-green-500 text-white",
  comment: "bg-amber-500 text-white",
  like: "bg-pink-500 text-white"
};
const typeEmoji = {
  event: "📅",
  post: "📝",
  join: "👋",
  comment: "💬",
  like: "❤️"
};
function ActivityCard({ activities }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between border-b border-border px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-card-foreground", children: "Recent Activity" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "What's happening in your mohalla" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border", children: activities.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-6 text-sm text-muted-foreground text-center", children: "No recent activity yet." }) : activities.map((activity) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 p-4 transition-colors hover:bg-muted/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-gradient-to-br from-primary/60 to-accent/60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs", typeColors[activity.type]), children: typeEmoji[activity.type] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-card-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: activity.user }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: activity.action }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-primary", children: activity.target })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: activity.time })
      ] })
    ] }, activity.id)) })
  ] });
}
const categoryColors = {
  Community: "bg-primary/10 text-primary",
  Sports: "bg-green-500/10 text-green-600",
  Culture: "bg-accent/10 text-accent",
  Food: "bg-amber-500/10 text-amber-600",
  Education: "bg-indigo-500/10 text-indigo-600"
};
function EventCard({ event, variant = "default" }) {
  if (variant === "compact") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-primary", children: new Date(event.date).toLocaleDateString("en-US", { month: "short" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold text-primary", children: new Date(event.date).getDate() })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "truncate font-semibold text-card-foreground", children: event.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-3 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 12 }),
            event.location
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 12 }),
            event.attendees,
            " going"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", categoryColors[event.category] || "bg-muted text-muted-foreground"), children: event.category })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-4 top-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-full px-3 py-1 text-xs font-semibold", categoryColors[event.category] || "bg-muted text-muted-foreground"), children: event.category }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -bottom-6 right-4 flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-border bg-card shadow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-primary", children: new Date(event.date).toLocaleDateString("en-US", { month: "short" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl font-bold text-card-foreground", children: new Date(event.date).getDate() })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative p-6 pt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-card-foreground", children: event.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 line-clamp-2 text-sm text-muted-foreground", children: event.description }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14, className: "text-primary" }),
          event.time
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14, className: "text-accent" }),
          event.location
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { size: 14, className: "text-primary" }),
          event.attendees,
          event.maxAttendees && `/${event.maxAttendees}`,
          " attending"
        ] })
      ] })
    ] })
  ] });
}
const actions = [
  { name: "Create Post", icon: Plus, color: "bg-primary/10 text-primary hover:bg-primary/20", description: "Share with community", href: "/feed" },
  { name: "New Event", icon: Calendar, color: "bg-accent/10 text-accent hover:bg-accent/20", description: "Organize gathering", href: "/events" },
  { name: "Announcement", icon: Megaphone, color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20", description: "Important updates", href: "/announcements" },
  { name: "List Item", icon: ShoppingBag, color: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20", description: "Sell or buy", href: "/marketplace" },
  { name: "Find People", icon: Users, color: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20", description: "Connect with neighbors", href: "/community" },
  { name: "Add Place", icon: MapPin, color: "bg-green-500/10 text-green-600 hover:bg-green-500/20", description: "Recommend spots", href: "/places" }
];
function QuickActions() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-12 -top-12 h-24 w-24 rounded-full bg-accent/5 blur-2xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-card-foreground", children: "Quick Actions" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "What would you like to do?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3", children: actions.map((action) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => navigate({ to: action.href }),
          className: cn("group flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-200", action.color),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(action.icon, { size: 24, className: "transition-transform duration-200 group-hover:scale-110" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: action.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs opacity-70", children: action.description })
            ] })
          ]
        },
        action.name
      )) })
    ] })
  ] });
}
function MemberCard({ members }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -left-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between border-b border-border px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-card-foreground", children: "Active Neighbors" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "People in your mohalla" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border", children: members.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "p-6 text-sm text-muted-foreground text-center", children: "No members yet." }) : members.map((member) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 p-4 transition-colors hover:bg-muted/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-full bg-gradient-to-br from-primary/50 to-accent/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card", member.isOnline ? "bg-green-500" : "bg-muted-foreground/30") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "truncate font-semibold text-card-foreground", children: member.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: member.role })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 16 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-9 w-9 rounded-lg text-primary hover:bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { size: 16 }) })
      ] })
    ] }, member.id)) })
  ] });
}
const TYPE_ICON = {
  theft: ShieldAlert,
  suspicious: TriangleAlert,
  emergency: Flame,
  power_outage: Zap,
  water_shortage: Droplets,
  other: CircleQuestionMark
};
const SEVERITY = {
  high: { bg: "bg-red-500/10", text: "text-red-600", dot: "bg-red-500" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-700", dot: "bg-amber-400" },
  low: { bg: "bg-green-500/10", text: "text-green-700", dot: "bg-green-500" }
};
function timeAgo$1(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1e3);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function SafetyWidget() {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["safety-alerts-widget"],
    queryFn: async () => {
      const { data, error } = await supabase.from("safety_alerts").select("id, title, alert_type, severity, location, is_resolved, created_at").eq("is_resolved", false).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data ?? [];
    }
  });
  const latest = alerts[0];
  const count = alerts.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/safety", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex h-8 w-8 items-center justify-center rounded-lg", count > 0 ? "bg-red-500/10" : "bg-green-500/10"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { size: 18, className: count > 0 ? "text-red-500" : "text-green-600" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-sm text-foreground", children: "Safety" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 16, className: "text-muted-foreground group-hover:text-foreground transition-colors" })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 rounded-lg bg-muted animate-pulse" }) : count === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-green-700", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "All clear" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "· No active alerts" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white", children: count }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-medium text-foreground", children: [
          "active alert",
          count !== 1 ? "s" : ""
        ] })
      ] }),
      latest && (() => {
        const TypeIcon = TYPE_ICON[latest.alert_type] || CircleQuestionMark;
        const sev = SEVERITY[latest.severity] || SEVERITY.medium;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex items-start gap-2 rounded-xl p-2.5", sev.bg), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", sev.dot) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cn("text-xs font-semibold truncate", sev.text), children: latest.title }),
            latest.location && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground truncate mt-0.5", children: latest.location }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: timeAgo$1(latest.created_at ?? (/* @__PURE__ */ new Date()).toISOString()) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TypeIcon, { size: 14, className: cn("shrink-0 mt-0.5", sev.text) })
        ] });
      })()
    ] })
  ] }) });
}
function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1e3);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function Dashboard() {
  const {
    user
  } = Route.useRouteContext();
  const {
    data: myProfile
  } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("profiles").select("full_name, display_name, unit_number").eq("id", user.id).maybeSingle();
      return data;
    }
  });
  const {
    data: stats
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [members2, events, posts, alerts] = await Promise.all([supabase.from("profiles").select("id", {
        count: "exact",
        head: true
      }), supabase.from("events").select("id", {
        count: "exact",
        head: true
      }).gte("event_date", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)), supabase.from("posts").select("id", {
        count: "exact",
        head: true
      }).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()), supabase.from("safety_alerts").select("id", {
        count: "exact",
        head: true
      }).eq("is_resolved", false)]);
      return {
        members: members2.count ?? 0,
        events: events.count ?? 0,
        posts: posts.count ?? 0,
        alerts: alerts.count ?? 0
      };
    }
  });
  const {
    data: recentPosts = []
  } = useQuery({
    queryKey: ["recent-posts"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("posts").select("id, title, type, created_at, profiles:user_id(full_name, display_name)").order("created_at", {
        ascending: false
      }).limit(5);
      return (data ?? []).map((p) => ({
        id: p.id,
        user: p.profiles?.full_name || p.profiles?.display_name || "Resident",
        action: p.type === "announcement" ? "posted an announcement" : "posted in",
        target: p.title,
        time: timeAgo(p.created_at),
        type: p.type === "event" ? "event" : "post"
      }));
    }
  });
  const {
    data: upcoming = []
  } = useQuery({
    queryKey: ["upcoming-events-dashboard"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("events").select("id, title, description, event_date, event_time, location, rsvp_count, max_attendees").gte("event_date", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)).order("event_date", {
        ascending: true
      }).limit(5);
      return (data ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? "",
        date: e.event_date,
        time: e.event_time ?? "",
        location: e.location ?? "TBA",
        attendees: e.rsvp_count ?? 0,
        maxAttendees: e.max_attendees ?? void 0,
        category: "Community"
      }));
    }
  });
  const {
    data: members = []
  } = useQuery({
    queryKey: ["recent-members"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("profiles").select("id, full_name, display_name, unit_number, is_verified, created_at").order("created_at", {
        ascending: false
      }).limit(4);
      return (data ?? []).map((p) => ({
        id: p.id,
        name: p.full_name || p.display_name || "Resident",
        role: p.is_verified ? "Verified Resident" : p.unit_number ? `Unit ${p.unit_number}` : "New Member",
        isOnline: false
      }));
    }
  });
  const greetName = (myProfile?.full_name || myProfile?.display_name || user.email?.split("@")[0] || "Neighbor").split(" ")[0];
  const featured = upcoming.slice(0, 2);
  const compact = upcoming.slice(2);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-6 w-6 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl font-bold text-foreground", children: [
          "Assalam-o-Alaikum, ",
          greetName,
          "!"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Here's what's happening in your mohalla today" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Community Members", value: stats?.members ?? "—", icon: Users, iconColor: "bg-primary/10 text-primary", description: "verified residents" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Upcoming Events", value: stats?.events ?? "—", icon: Calendar, iconColor: "bg-accent/10 text-accent", description: "this week & beyond" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Posts This Week", value: stats?.posts ?? "—", icon: MessageSquare, iconColor: "bg-amber-500/10 text-amber-600", description: "community activity" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { title: "Active Alerts", value: stats?.alerts ?? "—", icon: Heart, iconColor: "bg-pink-500/10 text-pink-600", description: "needs attention" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 lg:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-foreground", children: "Upcoming Events" }) }),
          featured.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground", children: "No upcoming events yet." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: featured.map((event) => /* @__PURE__ */ jsxRuntimeExports.jsx(EventCard, { event }, event.id)) })
        ] }),
        compact.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-foreground", children: "More This Week" }),
          compact.map((event) => /* @__PURE__ */ jsxRuntimeExports.jsx(EventCard, { event, variant: "compact" }, event.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SafetyWidget, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(QuickActions, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ActivityCard, { activities: recentPosts }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(MemberCard, { members })
      ] })
    ] })
  ] });
}
export {
  Dashboard as component
};
