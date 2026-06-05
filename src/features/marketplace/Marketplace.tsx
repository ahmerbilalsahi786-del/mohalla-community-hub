import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Plus, X, Search, ChevronDown, ChevronUp,
  Armchair, Tv2, Shirt, Car, Wrench, Gift, Package, Tag,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Route as AuthLayout } from "@/routes/_authenticated/route";

type Category = "all" | "furniture" | "electronics" | "clothes" | "vehicles" | "services" | "free" | "other";
type Condition = "new" | "good" | "fair";

const CATEGORIES: { value: Category; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Package },
  { value: "furniture", label: "Furniture", icon: Armchair },
  { value: "electronics", label: "Electronics", icon: Tv2 },
  { value: "clothes", label: "Clothes", icon: Shirt },
  { value: "vehicles", label: "Vehicles", icon: Car },
  { value: "services", label: "Services", icon: Wrench },
  { value: "free", label: "Free", icon: Gift },
  { value: "other", label: "Other", icon: Package },
];

const CONDITION_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  good: { label: "Good", bg: "bg-blue-500/10", text: "text-blue-600" },
  fair: { label: "Fair", bg: "bg-amber-500/10", text: "text-amber-700" },
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "Available", bg: "bg-emerald-500/10", text: "text-emerald-700" },
  sold: { label: "Sold", bg: "bg-muted", text: "text-muted-foreground" },
  reserved: { label: "Reserved", bg: "bg-amber-500/10", text: "text-amber-700" },
};

interface Author { full_name: string | null; display_name: string | null; unit_number: string | null }
interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price_pkr: number | null;
  category: string;
  condition: string;
  image_urls: string[] | null;
  status: string;
  whatsapp_number: string | null;
  created_at: string;
  profiles: Author | null;
}

function formatPrice(pkr: number | null | undefined) {
  if (pkr === null || pkr === undefined) return "Free";
  return `Rs ${pkr.toLocaleString()}`;
}
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function whatsappHref(num: string, title: string) {
  const clean = num.replace(/[^\d]/g, "");
  const e164 = clean.startsWith("92") ? clean : `92${clean.replace(/^0+/, "")}`;
  const text = encodeURIComponent(`Hi! I'm interested in your "${title}" listing on Mohalla.`);
  return `https://wa.me/${e164}?text=${text}`;
}

function ListingCard({ listing }: { listing: Listing }) {
  const cond = CONDITION_BADGE[listing.condition] || CONDITION_BADGE.good;
  const status = STATUS_BADGE[listing.status] || STATUS_BADGE.active;
  const isSold = listing.status !== "active";
  const images = listing.image_urls ?? [];

  return (
    <Link to="/marketplace/$id" params={{ id: listing.id }}>
      <div className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer h-full",
        isSold && "opacity-60",
      )}>
        <div className="relative aspect-[4/3] bg-muted/50 overflow-hidden">
          {images.length > 0 ? (
            <img src={images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={40} className="text-muted-foreground/30" />
            </div>
          )}
          {isSold && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className={cn("rounded-full px-3 py-1 text-sm font-bold", status.bg, status.text)}>{status.label}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-3 gap-1.5">
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{listing.title}</h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", cond.bg, cond.text)}>{cond.label}</span>
          </div>
          <p className="text-base font-bold text-primary mt-auto">{formatPrice(listing.price_pkr)}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{listing.profiles?.unit_number ?? ""}</span>
            <span>{timeAgo(listing.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CreateListingModal({ onClose, me }: { onClose: () => void; me: User }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePkr, setPricePkr] = useState("");
  const [category, setCategory] = useState<Exclude<Category, "all">>("other");
  const [condition, setCondition] = useState<Condition>("good");
  const [whatsapp, setWhatsapp] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("listings").insert({
        user_id: me.id,
        title: title.trim(),
        description: description.trim(),
        price_pkr: pricePkr ? parseInt(pricePkr, 10) : null,
        category,
        condition,
        whatsapp_number: whatsapp.trim(),
        image_urls: [],
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Could not create listing", description: e.message, variant: "destructive" }),
  });

  const catOptions: { value: Exclude<Category, "all">; label: string }[] = [
    { value: "furniture", label: "Furniture" },
    { value: "electronics", label: "Electronics" },
    { value: "clothes", label: "Clothes" },
    { value: "vehicles", label: "Vehicles" },
    { value: "services", label: "Services" },
    { value: "free", label: "Free" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Add Listing</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {catOptions.map((opt) => (
                <button key={opt.value} onClick={() => setCategory(opt.value)}
                  className={cn(
                    "rounded-xl py-2 text-xs font-medium border transition-all",
                    category === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50",
                  )}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you selling?"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the item..."
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Price (PKR)</label>
              <input type="number" min={0} value={pricePkr} onChange={(e) => setPricePkr(e.target.value)} placeholder="Leave empty if free"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors">
                <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">WhatsApp Number</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium shrink-0">+92</span>
              <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="3001234567"
                className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Photo uploads will be enabled once storage is set up.</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20 shrink-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={() => create.mutate()}
            disabled={!title.trim() || !description.trim() || !whatsapp.trim() || create.isPending}
            className="rounded-xl">
            {create.isPending ? "Posting…" : "List Item"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { user } = AuthLayout.useRouteContext();
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data: rawListings = [], isLoading } = useQuery({
    queryKey: ["listings", activeCategory],
    queryFn: async (): Promise<Listing[]> => {
      let q = supabase
        .from("listings")
        .select("id, user_id, title, description, price_pkr, category, condition, image_urls, status, whatsapp_number, created_at, profiles:user_id(full_name, display_name, unit_number)")
        .order("created_at", { ascending: false })
        .limit(60);
      if (activeCategory !== "all") q = q.eq("category", activeCategory);
      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as Listing[]) ?? [];
    },
  });

  const listings = useMemo(() => {
    const s = search.trim().toLowerCase();
    const minP = minPrice ? parseInt(minPrice, 10) : undefined;
    const maxP = maxPrice ? parseInt(maxPrice, 10) : undefined;
    return rawListings.filter((l) => {
      if (s && !l.title.toLowerCase().includes(s) && !l.description.toLowerCase().includes(s)) return false;
      const p = l.price_pkr ?? 0;
      if (minP !== undefined && p < minP) return false;
      if (maxP !== undefined && p > maxP) return false;
      return true;
    });
  }, [rawListings, search, minPrice, maxPrice]);

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col">
        <header className="border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <span className="font-bold text-primary-foreground">م</span>
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Mohalla</p>
                <h1 className="text-sm font-semibold leading-tight">Marketplace</h1>
              </div>
            </div>
            <nav className="flex items-center gap-1 text-sm">
              <Link to="/" className="rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-muted">Feed</Link>
              <Link to="/marketplace" className="rounded-lg px-3 py-1.5 bg-muted font-medium">Marketplace</Link>
            </nav>
          </div>
        </header>

        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-6 py-3 space-y-3">
          <div className="mx-auto max-w-5xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="search" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:bg-background transition-colors" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors shrink-0",
                  showFilters || minPrice || maxPrice ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:bg-muted")}>
                <Tag size={14} /> Price {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {showFilters && (
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  className="w-28 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
                <span className="text-muted-foreground text-sm">to</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-28 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
                {(minPrice || maxPrice) && (
                  <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.value;
                return (
                  <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
                    className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all shrink-0",
                      active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    <Icon size={14} /> {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="p-6 max-w-5xl mx-auto pb-24">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <Package size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-foreground">No listings yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to list something for your neighbors!</p>
                <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl">
                  <Plus size={16} className="mr-2" /> Add Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </div>
        </main>
      </div>

      <button onClick={() => setShowCreate(true)} aria-label="Add listing"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all z-40">
        <Plus size={24} />
      </button>

      {showCreate && <CreateListingModal onClose={() => setShowCreate(false)} me={user} />}
    </div>
  );
}

export { whatsappHref };
