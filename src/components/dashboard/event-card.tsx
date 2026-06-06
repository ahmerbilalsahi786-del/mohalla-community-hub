import { Calendar, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees?: number;
  category: string;
}

const categoryColors: Record<string, string> = {
  Community: "bg-primary/10 text-primary",
  Sports: "bg-green-500/10 text-green-600",
  Culture: "bg-accent/10 text-accent",
  Food: "bg-amber-500/10 text-amber-600",
  Education: "bg-indigo-500/10 text-indigo-600",
};

export function EventCard({ event, variant = "default" }: { event: DashboardEvent; variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10">
          <span className="text-xs font-medium text-primary">
            {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-xl font-bold text-primary">{new Date(event.date).getDate()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="truncate font-semibold text-card-foreground">{event.title}</h4>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>
            <span className="flex items-center gap-1"><Users size={12} />{event.attendees} going</span>
          </div>
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", categoryColors[event.category] || "bg-muted text-muted-foreground")}>
          {event.category}
        </span>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
      <div className="relative h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
        <div className="absolute left-4 top-4">
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", categoryColors[event.category] || "bg-muted text-muted-foreground")}>
            {event.category}
          </span>
        </div>
        <div className="absolute -bottom-6 right-4 flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-border bg-card shadow-md">
          <span className="text-xs font-medium text-primary">
            {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-2xl font-bold text-card-foreground">{new Date(event.date).getDate()}</span>
        </div>
      </div>
      <div className="relative p-6 pt-8">
        <h3 className="text-lg font-bold text-card-foreground">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" />{event.time}</div>
          <div className="flex items-center gap-1.5"><MapPin size={14} className="text-accent" />{event.location}</div>
          <div className="flex items-center gap-1.5"><Users size={14} className="text-primary" />
            {event.attendees}{event.maxAttendees && `/${event.maxAttendees}`} attending
          </div>
        </div>
      </div>
    </div>
  );
}
