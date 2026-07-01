import type { ElementType } from "react";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import {
  AlertTriangle,
  BarChart2,
  Calendar,
  ChevronRight,
  Globe2,
  MapPin,
  MessageSquare,
  Package,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  CityPublication,
  CityPublicationSourceType,
  useListCityPublications,
} from "@/lib/city-publications";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

const TYPE_OPTIONS: Array<{ value: CityPublicationSourceType | "all"; label: string; icon: ElementType }> = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "post", label: "Posts", icon: MessageSquare },
  { value: "event", label: "Events", icon: Calendar },
  { value: "listing", label: "Listings", icon: Package },
  { value: "poll", label: "Polls", icon: BarChart2 },
  { value: "safety_alert", label: "Safety", icon: ShieldAlert },
];

const TYPE_META: Record<string, { label: string; icon: ElementType; tone: string }> = {
  post: { label: "Post", icon: MessageSquare, tone: "bg-sky-500/10 text-sky-700" },
  event: { label: "Event", icon: Calendar, tone: "bg-emerald-500/10 text-emerald-700" },
  listing: { label: "Listing", icon: Package, tone: "bg-violet-500/10 text-violet-700" },
  poll: { label: "Poll", icon: BarChart2, tone: "bg-amber-500/10 text-amber-700" },
  safety_alert: { label: "Safety", icon: ShieldAlert, tone: "bg-red-500/10 text-red-600" },
  place: { label: "Place", icon: MapPin, tone: "bg-cyan-500/10 text-cyan-700" },
  volunteer: { label: "Volunteer", icon: Globe2, tone: "bg-green-500/10 text-green-700" },
};

function money(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Free";
  return `Rs ${amount.toLocaleString()}`;
}

function metadataLine(publication: CityPublication) {
  const data = publication.metadata ?? {};
  if (publication.sourceType === "event") {
    return [data.date, data.time, data.location].filter(Boolean).join(" - ");
  }
  if (publication.sourceType === "listing") {
    return [money(data.pricePkr), data.category, data.status].filter(Boolean).join(" - ");
  }
  if (publication.sourceType === "poll") {
    const options = Array.isArray(data.options) ? data.options.length : 0;
    return options ? `${options} options` : "Community poll";
  }
  if (publication.sourceType === "safety_alert") {
    return [data.severity, data.location].filter(Boolean).join(" - ");
  }
  if (publication.sourceType === "post") {
    return data.postType ? String(data.postType).replace(/_/g, " ") : "Community post";
  }
  return "";
}

function PublicationCard({ publication }: { publication: CityPublication }) {
  const meta = TYPE_META[publication.sourceType] ?? TYPE_META.post;
  const Icon = meta.icon;
  const detail = metadataLine(publication);

  return (
    <article className="overflow-hidden rounded-2xl border portal-soft-rule bg-card/88 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
      {publication.imageUrl && (
        <img src={publication.imageUrl} alt="" className="h-52 w-full object-cover" />
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.tone)}>
            <Icon size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-black", meta.tone)}>
                {meta.label}
              </span>
              <span className="truncate text-xs font-semibold text-muted-foreground">
                {publication.communityName}
                {publication.communityArea ? `, ${publication.communityArea}` : ""}
              </span>
            </div>

            <h2 className="mt-2 text-base font-black leading-snug text-foreground sm:text-lg">{publication.title}</h2>
            {publication.summary && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{publication.summary}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t portal-soft-rule pt-3">
          <div className="min-w-0 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{publication.authorName}</p>
            <p className="truncate">
              {detail ? `${detail} - ` : ""}
              {formatDistanceToNow(new Date(publication.publishedAt), { addSuffix: true })}
            </p>
          </div>
          <Link
            href={publication.href || "/city-feed"}
            className="inline-flex min-h-9 items-center gap-1 rounded-xl border portal-soft-rule bg-background/75 px-3 text-sm font-black text-foreground shadow-sm transition-colors hover:bg-background"
          >
            Open
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function CityFeed() {
  const { data: user } = useCurrentUser();
  const [sourceType, setSourceType] = useState<CityPublicationSourceType | "all">("all");
  const [search, setSearch] = useState("");
  const params = useMemo(
    () => ({
      sourceType,
      search: search.trim() || undefined,
      limit: 40,
    }),
    [search, sourceType],
  );
  const { data, isLoading } = useListCityPublications(params);
  const items = data?.items ?? [];
  const city = data?.city || user?.community?.city || "your city";
  const counts = useMemo(
    () =>
      TYPE_OPTIONS.filter((option) => option.value !== "all").map((option) => ({
        ...option,
        count: items.filter((item) => item.sourceType === option.value).length,
      })),
    [items],
  );

  return (
    <DashboardShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border portal-soft-rule bg-card/78 p-4 shadow-sm backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="portal-chip mb-2 w-fit text-primary">
                  <Globe2 className="h-3.5 w-3.5" />
                  {city} City Feed
                </div>
                <h1 className="portal-section-title text-2xl text-foreground sm:text-3xl">Public updates across {city}</h1>
              </div>
              <div className="rounded-2xl border portal-soft-rule bg-background/70 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-black uppercase text-muted-foreground">Public items</p>
                <p className="text-2xl font-black text-foreground">{data?.total ?? 0}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${city} posts, events, alerts...`}
                  className="h-12 w-full rounded-xl border portal-soft-rule bg-background/72 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary/45"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = sourceType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSourceType(option.value)}
                      className={cn(
                        "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-black shadow-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "border portal-soft-rule bg-background/70 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon size={15} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-48 rounded-2xl border portal-soft-rule bg-card/70 shadow-sm animate-pulse" />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-3">
              {items.map((publication) => (
                <PublicationCard key={publication.id} publication={publication} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border portal-soft-rule bg-card/78 p-8 text-center shadow-sm backdrop-blur">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <AlertTriangle size={26} />
              </div>
              <h2 className="mt-4 text-lg font-black text-foreground">No public city updates yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Admin-approved public posts, events, listings, polls, and alerts will appear here.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border portal-soft-rule bg-card/78 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-black uppercase text-muted-foreground">Your society</p>
            <h2 className="mt-2 text-lg font-black text-foreground">{user?.community?.name ?? "Mohalla Community"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.community?.area ?? city}</p>
          </div>
          <div className="rounded-2xl border portal-soft-rule bg-card/78 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-black uppercase text-muted-foreground">City activity</p>
            <div className="mt-3 space-y-2">
              {counts.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.value} className="flex items-center justify-between gap-3 rounded-xl border portal-soft-rule bg-background/60 px-3 py-2">
                    <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                      <Icon size={14} className="shrink-0 text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className="text-sm font-black text-muted-foreground">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
