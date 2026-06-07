import { W as jsxRuntimeExports } from "./server-jgJDFZ6n.js";
import { b as Route, u as useNavigate, a as useQueryClient, L as Link } from "./router-B2v70SHd.js";
import { u as useQuery } from "./useQuery-CX4ajZb6.js";
import { u as useMutation } from "./x-YmbaP7Z5.js";
import { supabase } from "./client-CMfAcMyN.js";
import { B as Button, c as cn } from "./button-dmcdYm9w.js";
import { u as useToast } from "./use-toast-BLjjwiW_.js";
import { P as Package, w as whatsappHref } from "./Marketplace-Du01djo7.js";
import { c as createLucideIcon } from "./createLucideIcon-B-hS4TPQ.js";
import { C as CircleCheck } from "./circle-check-D3eWA9s5.js";
import "node:async_hooks";
import "node:stream";
import "node:stream/web";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./search-DKCJPFVK.js";
import "./plus-B2pBjOns.js";
const __iconNode$2 = [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
];
const ArrowLeft = createLucideIcon("arrow-left", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
      key: "1sd12s"
    }
  ]
];
const MessageCircle = createLucideIcon("message-circle", __iconNode$1);
const __iconNode = [
  ["path", { d: "M10 11v6", key: "nco0om" }],
  ["path", { d: "M14 11v6", key: "outv1u" }],
  ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode);
function formatPrice(pkr) {
  if (pkr === null || pkr === void 0) return "Free";
  return `Rs ${pkr.toLocaleString()}`;
}
function ListingDetail() {
  const {
    id
  } = Route.useParams();
  const {
    user
  } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    toast
  } = useToast();
  const {
    data: listing,
    isLoading
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("listings").select("id, user_id, title, description, price_pkr, category, condition, image_urls, status, whatsapp_number, created_at, profiles:user_id(full_name, display_name, unit_number)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
  const setStatus = useMutation({
    mutationFn: async (status) => {
      const {
        error
      } = await supabase.from("listings").update({
        status
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["listing", id]
      });
      qc.invalidateQueries({
        queryKey: ["listings"]
      });
    }
  });
  const remove = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Listing deleted"
      });
      qc.invalidateQueries({
        queryKey: ["listings"]
      });
      navigate({
        to: "/marketplace"
      });
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Loading…" });
  }
  if (!listing) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Listing not found." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "rounded-xl", children: "Back to Marketplace" }) })
    ] });
  }
  const isOwner = listing.user_id === user.id;
  const images = listing.image_urls ?? [];
  const author = listing.profiles;
  const name = author?.full_name || author?.display_name || "Resident";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-3xl items-center gap-3 px-6 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 18 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-sm font-semibold", children: "Listing" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-3xl px-6 py-6 space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "aspect-[16/10] bg-muted/50 flex items-center justify-center", children: images.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: images[0], alt: listing.title, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 60, className: "text-muted-foreground/30" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-foreground", children: listing.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", listing.status === "active" ? "bg-emerald-500/10 text-emerald-700" : listing.status === "sold" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-700"), children: listing.status === "active" ? "Available" : listing.status === "sold" ? "Sold" : "Reserved" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-bold text-primary", children: formatPrice(listing.price_pkr) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap", children: listing.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2.5 py-1 text-muted-foreground capitalize", children: listing.category }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2.5 py-1 text-muted-foreground capitalize", children: listing.condition })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border pt-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-medium", children: name }),
            author?.unit_number && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs", children: [
              "Unit ",
              author.unit_number
            ] })
          ] })
        ] })
      ] }),
      !isOwner && listing.status === "active" && listing.whatsapp_number && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: whatsappHref(listing.whatsapp_number, listing.title), target: "_blank", rel: "noopener noreferrer", className: "flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-white font-semibold hover:bg-[#1da851] transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { size: 18 }),
        " Contact on WhatsApp"
      ] }),
      isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "Manage your listing" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          listing.status !== "sold" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "rounded-xl", onClick: () => setStatus.mutate("sold"), disabled: setStatus.isPending, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16, className: "mr-2" }),
            " Mark as sold"
          ] }),
          listing.status !== "active" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "rounded-xl", onClick: () => setStatus.mutate("active"), disabled: setStatus.isPending, children: "Reopen" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", className: "rounded-xl", onClick: () => remove.mutate(), disabled: remove.isPending, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 16, className: "mr-2" }),
            " Delete"
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ListingDetail as component
};
