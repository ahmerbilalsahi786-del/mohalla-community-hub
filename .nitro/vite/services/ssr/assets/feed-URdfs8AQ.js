import { r as reactExports, W as jsxRuntimeExports } from "./server-g7R9gkSO.js";
import { u as useQuery } from "./useQuery-BdNjM0SX.js";
import { R as Route, a as useQueryClient } from "./router-CMoA4Ebz.js";
import { u as useMutation, C as ChevronUp, a as ChevronDown, X } from "./x-eDJsA0nm.js";
import { supabase } from "./client-Iwpyqn57.js";
import { c as createLucideIcon, a as cn, B as Button } from "./button-CSFdOUD2.js";
import { u as useToast } from "./use-toast-CKJEht_R.js";
import { U as Users, a as Megaphone, S as ShoppingBag, C as Calendar, M as MessageSquare, H as Heart } from "./users-BqSnx75F.js";
import { S as Search } from "./search-B97MuMYY.js";
import { P as Plus } from "./plus-C7L7OMir.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const __iconNode$2 = [
  ["path", { d: "M12 17v5", key: "bb1du9" }],
  [
    "path",
    {
      d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",
      key: "1nkz8b"
    }
  ]
];
const Pin = createLucideIcon("pin", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
const Send = createLucideIcon("send", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ]
];
const Shield = createLucideIcon("shield", __iconNode);
const CATEGORIES = [
  { value: "all", label: "All", icon: Users, color: "text-foreground" },
  { value: "announcement", label: "Announcements", icon: Megaphone, color: "text-amber-600" },
  { value: "safety", label: "Safety", icon: Shield, color: "text-red-500" },
  { value: "lost_found", label: "Lost & Found", icon: Search, color: "text-blue-500" },
  { value: "buy_sell", label: "Buy & Sell", icon: ShoppingBag, color: "text-green-600" },
  { value: "event", label: "Events", icon: Calendar, color: "text-accent" }
];
const CATEGORY_BADGE = {
  announcement: { label: "Announcement", bg: "bg-amber-500/10", text: "text-amber-700" },
  safety: { label: "Safety", bg: "bg-red-500/10", text: "text-red-600" },
  lost_found: { label: "Lost & Found", bg: "bg-blue-500/10", text: "text-blue-600" },
  buy_sell: { label: "Buy & Sell", bg: "bg-green-500/10", text: "text-green-700" },
  event: { label: "Event", bg: "bg-accent/10", text: "text-accent" },
  general: { label: "General", bg: "bg-muted", text: "text-muted-foreground" }
};
function authorName(a) {
  return a?.full_name || a?.display_name || "Resident";
}
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1e3);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function AvatarInitials({ name, size = "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(
    "flex items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 font-bold text-white shrink-0",
    size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
  ), children: initials });
}
function CommentSection({ postId, me }) {
  const [body, setBody] = reactExports.useState("");
  const qc = useQueryClient();
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase.from("comments").select("id, post_id, user_id, body, created_at, profiles:user_id(full_name, display_name, unit_number)").eq("post_id", postId).order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
  });
  const create = useMutation({
    mutationFn: async (text) => {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: me.user.id,
        body: text
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    }
  });
  function submit() {
    const t = body.trim();
    if (!t) return;
    create.mutate(t);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 border-t border-border pt-4 space-y-3", children: [
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading comments…" }) : comments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No comments yet. Be the first!" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: comments.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarInitials, { name: authorName(c.profiles), size: "sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/50 rounded-xl px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-foreground", children: authorName(c.profiles) }),
            c.profiles?.unit_number && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: c.profiles.unit_number })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground mt-0.5 whitespace-pre-wrap", children: c.body })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 px-1", children: timeAgo(c.created_at) })
      ] })
    ] }, c.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarInitials, { name: authorName(me.profile), size: "sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex gap-2 items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            placeholder: "Write a comment...",
            value: body,
            onChange: (e) => setBody(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && submit(),
            className: "flex-1 text-sm bg-muted/50 rounded-xl px-3 py-2 border border-border focus:outline-none focus:border-primary focus:bg-background transition-colors"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: submit,
            disabled: !body.trim() || create.isPending,
            className: "flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 15 })
          }
        )
      ] })
    ] })
  ] });
}
function PostCard({ post, me, likedByMe }) {
  const [expanded, setExpanded] = reactExports.useState(false);
  const qc = useQueryClient();
  const badge = CATEGORY_BADGE[post.type] || CATEGORY_BADGE.general;
  const like = useMutation({
    mutationFn: async () => {
      if (likedByMe) {
        const { error } = await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", me.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: me.user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["my-likes"] });
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow", children: [
    post.is_pinned && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 border-b border-border/50 bg-primary/5 px-4 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Pin, { size: 13, className: "text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-primary", children: "Pinned Post" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarInitials, { name: authorName(post.profiles) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-sm text-foreground", children: authorName(post.profiles) }),
            post.profiles?.unit_number && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: post.profiles.unit_number }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: timeAgo(post.created_at) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", badge.bg, badge.text), children: badge.label })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-foreground mb-1", children: post.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap", children: post.body })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => like.mutate(),
            disabled: like.isPending,
            className: cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors",
              likedByMe ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            ),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { size: 18, className: likedByMe ? "fill-current" : "" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.likes_count })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setExpanded(!expanded),
            className: "flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 18 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: post.comments_count }),
              expanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14 })
            ]
          }
        )
      ] }),
      expanded && /* @__PURE__ */ jsxRuntimeExports.jsx(CommentSection, { postId: post.id, me })
    ] })
  ] });
}
function CreatePostModal({ onClose, me }) {
  const [type, setType] = reactExports.useState("general");
  const [title, setTitle] = reactExports.useState("");
  const [body, setBody] = reactExports.useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("posts").insert({
        user_id: me.user.id,
        type,
        title: title.trim(),
        body: body.trim(),
        image_urls: []
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      onClose();
    },
    onError: (e) => toast({ title: "Could not create post", description: e.message, variant: "destructive" })
  });
  const typeOptions = [
    { value: "general", label: "General" },
    { value: "announcement", label: "Announcement" },
    { value: "safety", label: "Safety" },
    { value: "lost_found", label: "Lost & Found" },
    { value: "buy_sell", label: "Buy & Sell" },
    { value: "event", label: "Event" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold text-foreground", children: "Create Post" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarInitials, { name: authorName(me.profile) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-sm text-foreground", children: authorName(me.profile) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            me.profile?.unit_number ? `${me.profile.unit_number} · ` : "",
            "Mohalla Community"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block", children: "Category" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: typeOptions.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setType(opt.value),
            className: cn(
              "rounded-xl py-2 px-3 text-sm font-medium border transition-all",
              type === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50"
            ),
            children: opt.label
          },
          opt.value
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block", children: "Title" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: title,
            onChange: (e) => setTitle(e.target.value),
            placeholder: "What's this about?",
            className: "w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-background transition-colors"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block", children: "Message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: body,
            onChange: (e) => setBody(e.target.value),
            rows: 4,
            placeholder: "Share something with your neighbors...",
            className: "w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:bg-background transition-colors resize-none"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, className: "rounded-xl", children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: () => create.mutate(),
          disabled: title.trim().length < 3 || body.trim().length < 10 || create.isPending,
          className: "rounded-xl",
          children: create.isPending ? "Posting…" : "Post"
        }
      )
    ] })
  ] }) });
}
function Feed() {
  const { user } = Route.useRouteContext();
  const [activeCategory, setActiveCategory] = reactExports.useState("all");
  const [showCreate, setShowCreate] = reactExports.useState(false);
  const { data: myProfile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("full_name, display_name, unit_number").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", activeCategory],
    queryFn: async () => {
      let q = supabase.from("posts").select("id, user_id, title, body, type, image_urls, is_pinned, likes_count, comments_count, created_at, profiles:user_id(full_name, display_name, unit_number)").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(50);
      if (activeCategory !== "all") q = q.eq("type", activeCategory);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    }
  });
  const { data: myLikes = /* @__PURE__ */ new Set() } = useQuery({
    queryKey: ["my-likes", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.post_id));
    }
  });
  const me = { user, profile: myProfile ?? null };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-16 z-30 -mx-4 sm:-mx-6 bg-background/90 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-2xl flex items-center gap-2 overflow-x-auto", children: CATEGORIES.map((cat) => {
      const Icon = cat.icon;
      const active = activeCategory === cat.value;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setActiveCategory(cat.value),
          className: cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all shrink-0",
            active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 14, className: active ? "" : cat.color }),
            cat.label
          ]
        },
        cat.value
      );
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-2xl mx-auto space-y-4", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4 animate-pulse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-muted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-32 bg-muted rounded" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-24 bg-muted rounded" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-3/4 bg-muted rounded" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-full bg-muted rounded" })
      ] })
    ] }, i)) }) : posts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 32, className: "text-muted-foreground/50" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-foreground", children: "No posts yet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Be the first to post something!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowCreate(true), className: "mt-4 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 16, className: "mr-2" }),
        " Create Post"
      ] })
    ] }) : posts.map((post) => /* @__PURE__ */ jsxRuntimeExports.jsx(PostCard, { post, me, likedByMe: myLikes.has(post.id) }, post.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setShowCreate(true),
        "aria-label": "Create post",
        className: "fixed bottom-24 md:bottom-8 right-6 md:right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all z-40",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 24 })
      }
    ),
    showCreate && /* @__PURE__ */ jsxRuntimeExports.jsx(CreatePostModal, { onClose: () => setShowCreate(false), me })
  ] });
}
const SplitComponent = Feed;
export {
  SplitComponent as component
};
