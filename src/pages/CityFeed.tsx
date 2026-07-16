import type { ElementType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  BarChart2,
  Building2,
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
  CityMapCommunity,
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

type CityMapPoint = {
  id: string;
  type: "community" | "event" | "safety_alert";
  title: string;
  subtitle: string;
  latitude: number;
  longitude: number;
  href?: string;
};

const FALLBACK_CITY_CENTERS: Record<string, [number, number]> = {
  karachi: [24.8607, 67.0011],
  lahore: [31.5204, 74.3587],
  islamabad: [33.6844, 73.0479],
  rawalpindi: [33.5651, 73.0169],
  faisalabad: [31.4504, 73.135],
  multan: [30.1575, 71.5249],
  peshawar: [34.0151, 71.5249],
  gujranwala: [32.1877, 74.1945],
  hyderabad: [25.396, 68.3578],
  sialkot: [32.4945, 74.5229],
};

const mapIcons = {
  community: L.divIcon({
    className: "",
    html: '<div style="height:30px;width:30px;border-radius:999px;border:3px solid white;background:#0f766e;color:white;display:flex;align-items:center;justify-content:center;font:700 13px Arial;box-shadow:0 8px 18px rgba(15,23,42,.22)">S</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  }),
  event: L.divIcon({
    className: "",
    html: '<div style="height:30px;width:30px;border-radius:999px;border:3px solid white;background:#16a34a;color:white;display:flex;align-items:center;justify-content:center;font:700 13px Arial;box-shadow:0 8px 18px rgba(15,23,42,.22)">E</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  }),
  safety_alert: L.divIcon({
    className: "",
    html: '<div style="height:30px;width:30px;border-radius:999px;border:3px solid white;background:#dc2626;color:white;display:flex;align-items:center;justify-content:center;font:700 13px Arial;box-shadow:0 8px 18px rgba(15,23,42,.22)">!</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  }),
};

function numberPoint(lat: unknown, lng: unknown) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function cityCenter(city: string, points: CityMapPoint[]): [number, number] {
  if (points.length > 0) {
    const totals = points.reduce(
      (sum, point) => [sum[0] + point.latitude, sum[1] + point.longitude] as [number, number],
      [0, 0] as [number, number],
    );
    return [totals[0] / points.length, totals[1] / points.length];
  }
  return FALLBACK_CITY_CENTERS[city.trim().toLowerCase()] ?? FALLBACK_CITY_CENTERS.lahore;
}

function escapeMapHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char] ?? char;
  });
}

function LeafletCityMap({ points, center }: { points: CityMapPoint[]; center: [number, number] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(center, 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markerLayerRef.current = markerLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();
    points.forEach((point) => {
      const html = [
        '<div class="min-w-44">',
        `<p class="font-bold text-slate-900">${escapeMapHtml(point.title)}</p>`,
        point.subtitle ? `<p class="mt-1 text-xs text-slate-600">${escapeMapHtml(point.subtitle)}</p>` : "",
        point.href
          ? `<a href="${escapeMapHtml(point.href)}" class="mt-2 inline-block text-xs font-bold text-blue-700">Open</a>`
          : "",
        "</div>",
      ].join("");

      L.marker([point.latitude, point.longitude], { icon: mapIcons[point.type] }).bindPopup(html).addTo(markerLayer);
    });

    if (points.length > 1) {
      map.fitBounds(points.map((point) => [point.latitude, point.longitude] as [number, number]), {
        padding: [34, 34],
        maxZoom: 14,
      });
    } else {
      map.setView(center, points.length === 1 ? 14 : 11);
    }

    setTimeout(() => map.invalidateSize(), 0);
  }, [center, points]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function CityMap({
  city,
  communities,
  publications,
}: {
  city: string;
  communities: CityMapCommunity[];
  publications: CityPublication[];
}) {
  const points = useMemo<CityMapPoint[]>(() => {
    const societyPoints = communities
      .map((community) => {
        const point = numberPoint(community.latitude, community.longitude);
        if (!point) return null;
        return {
          id: `community-${community.id}`,
          type: "community" as const,
          title: community.name,
          subtitle: [community.area, community.city].filter(Boolean).join(", "),
          ...point,
        };
      })
      .filter(Boolean) as CityMapPoint[];

    const publicPoints = publications
      .filter((publication) => publication.sourceType === "event" || publication.sourceType === "safety_alert")
      .map((publication) => {
        const point = numberPoint(publication.latitude, publication.longitude);
        if (!point) return null;
        return {
          id: `${publication.sourceType}-${publication.id}`,
          type: publication.sourceType as "event" | "safety_alert",
          title: publication.title,
          subtitle: `${TYPE_META[publication.sourceType]?.label ?? "Public item"} - ${publication.communityName}`,
          href: publication.href,
          ...point,
        };
      })
      .filter(Boolean) as CityMapPoint[];

    return [...societyPoints, ...publicPoints];
  }, [communities, publications]);

  const center = useMemo(() => cityCenter(city, points), [city, points]);

  return (
    <section className="overflow-hidden rounded-2xl border portal-soft-rule bg-card/78 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 border-b portal-soft-rule p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">City map</p>
          <h2 className="mt-1 text-lg font-black text-foreground">{city} societies and public updates</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border portal-soft-rule bg-background/70 px-2.5 py-1">
            <Building2 size={13} className="text-teal-700" /> Societies
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border portal-soft-rule bg-background/70 px-2.5 py-1">
            <Calendar size={13} className="text-green-700" /> Public events
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border portal-soft-rule bg-background/70 px-2.5 py-1">
            <ShieldAlert size={13} className="text-red-600" /> Safety reports
          </span>
        </div>
      </div>
      <div className="h-[23rem] w-full bg-muted/30">
        <LeafletCityMap points={points} center={center} />
      </div>
    </section>
  );
}

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
        <img
          src={publication.imageUrl}
          alt={publication.title}
          loading="lazy"
          decoding="async"
          className="h-56 w-full bg-muted/40 object-contain sm:h-72"
        />
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
  const communities = data?.communities ?? [];
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

          <CityMap city={city} communities={communities} publications={items} />

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
