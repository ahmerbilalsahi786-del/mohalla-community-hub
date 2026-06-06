import { Plus, Calendar, Megaphone, ShoppingBag, Users, MapPin } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const actions = [
  { name: "Create Post", icon: Plus, color: "bg-primary/10 text-primary hover:bg-primary/20", description: "Share with community", href: "/feed" },
  { name: "New Event", icon: Calendar, color: "bg-accent/10 text-accent hover:bg-accent/20", description: "Organize gathering", href: "/events" },
  { name: "Announcement", icon: Megaphone, color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20", description: "Important updates", href: "/announcements" },
  { name: "List Item", icon: ShoppingBag, color: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20", description: "Sell or buy", href: "/marketplace" },
  { name: "Find People", icon: Users, color: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20", description: "Connect with neighbors", href: "/community" },
  { name: "Add Place", icon: MapPin, color: "bg-green-500/10 text-green-600 hover:bg-green-500/20", description: "Recommend spots", href: "/places" },
];

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-accent/5 blur-2xl" />
      <div className="relative">
        <h3 className="text-lg font-bold text-card-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">What would you like to do?</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.name}
              onClick={() => navigate({ to: action.href })}
              className={cn("group flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-200", action.color)}
            >
              <action.icon size={24} className="transition-transform duration-200 group-hover:scale-110" />
              <div>
                <p className="text-sm font-semibold">{action.name}</p>
                <p className="text-xs opacity-70">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
