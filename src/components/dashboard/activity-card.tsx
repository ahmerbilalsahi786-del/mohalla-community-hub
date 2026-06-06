import { cn } from "@/lib/utils";

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "event" | "post" | "join" | "comment" | "like";
}

const typeColors: Record<Activity["type"], string> = {
  event: "bg-accent text-accent-foreground",
  post: "bg-primary text-primary-foreground",
  join: "bg-green-500 text-white",
  comment: "bg-amber-500 text-white",
  like: "bg-pink-500 text-white",
};

const typeEmoji: Record<Activity["type"], string> = {
  event: "📅", post: "📝", join: "👋", comment: "💬", like: "❤️",
};

export function ActivityCard({ activities }: { activities: Activity[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-card-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">What&apos;s happening in your mohalla</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No recent activity yet.</p>
        ) : activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/30">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/60 to-accent/60" />
              <div className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs", typeColors[activity.type])}>
                {typeEmoji[activity.type]}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground">
                <span className="font-semibold">{activity.user}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <span className="font-medium text-primary">{activity.target}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
