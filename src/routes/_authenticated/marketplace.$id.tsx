import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Package, MessageCircle, CheckCircle2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { whatsappHref } from "@/features/marketplace/Marketplace";

export const Route = createFileRoute("/_authenticated/marketplace/$id")({
  head: () => ({
    meta: [{ title: "Listing — Mohalla" }],
  }),
  component: ListingDetail,
});

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

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async (): Promise<Listing | null> => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, user_id, title, description, price_pkr, category, condition, image_urls, status, whatsapp_number, created_at, profiles:user_id(full_name, display_name, unit_number)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as Listing | null;
    },
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("listings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing", id] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Listing deleted" });
      qc.invalidateQueries({ queryKey: ["listings"] });
      navigate({ to: "/marketplace" });
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/marketplace"><Button variant="outline" className="rounded-xl">Back to Marketplace</Button></Link>
      </div>
    );
  }

  const isOwner = listing.user_id === user.id;
  const images = listing.image_urls ?? [];
  const author = listing.profiles;
  const name = author?.full_name || author?.display_name || "Resident";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-3">
          <Link to="/marketplace" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-semibold">Listing</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6 space-y-5">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="aspect-[16/10] bg-muted/50 flex items-center justify-center">
            {images.length > 0 ? (
              <img src={images[0]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <Package size={60} className="text-muted-foreground/30" />
            )}
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-foreground">{listing.title}</h2>
              <span className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                listing.status === "active" ? "bg-emerald-500/10 text-emerald-700" :
                listing.status === "sold" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-700",
              )}>
                {listing.status === "active" ? "Available" : listing.status === "sold" ? "Sold" : "Reserved"}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatPrice(listing.price_pkr)}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.description}</p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground capitalize">{listing.category}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground capitalize">{listing.condition}</span>
            </div>

            <div className="border-t border-border pt-3 text-sm">
              <p className="text-foreground font-medium">{name}</p>
              {author?.unit_number && <p className="text-muted-foreground text-xs">Unit {author.unit_number}</p>}
            </div>
          </div>
        </div>

        {!isOwner && listing.status === "active" && listing.whatsapp_number && (
          <a href={whatsappHref(listing.whatsapp_number, listing.title)} target="_blank" rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-white font-semibold hover:bg-[#1da851] transition-colors">
            <MessageCircle size={18} /> Contact on WhatsApp
          </a>
        )}

        {isOwner && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold">Manage your listing</p>
            <div className="flex flex-wrap gap-2">
              {listing.status !== "sold" && (
                <Button variant="outline" className="rounded-xl" onClick={() => setStatus.mutate("sold")} disabled={setStatus.isPending}>
                  <CheckCircle2 size={16} className="mr-2" /> Mark as sold
                </Button>
              )}
              {listing.status !== "active" && (
                <Button variant="outline" className="rounded-xl" onClick={() => setStatus.mutate("active")} disabled={setStatus.isPending}>
                  Reopen
                </Button>
              )}
              <Button variant="destructive" className="rounded-xl" onClick={() => remove.mutate()} disabled={remove.isPending}>
                <Trash2 size={16} className="mr-2" /> Delete
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
