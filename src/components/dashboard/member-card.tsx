import { MessageSquare, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Member {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
  mutualConnections?: number;
}

export function MemberCard({ members }: { members: Member[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-card-foreground">Active Neighbors</h3>
          <p className="text-sm text-muted-foreground">People in your mohalla</p>
        </div>
      </div>
      <div className="divide-y divide-border">
        {members.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No members yet.</p>
        ) : members.map((member) => (
          <div key={member.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/50 to-accent/50" />
              <div className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card", member.isOnline ? "bg-green-500" : "bg-muted-foreground/30")} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="truncate font-semibold text-card-foreground">{member.name}</h4>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                <MessageSquare size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary hover:bg-primary/10">
                <UserPlus size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
