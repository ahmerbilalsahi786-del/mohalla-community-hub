import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Building2, Loader2, MessageCircle, Search, ShieldCheck, Users } from "lucide-react";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SocietyReviewer, useSocietyReviewers, useStartConversation } from "@/lib/messages";
import { UserAvatar } from "@/components/community/user-avatar";

function reviewerName(reviewer: SocietyReviewer) {
  return reviewer.name || "Community reviewer";
}

export default function Reviewers() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: reviewers = [], isLoading, isError } = useSocietyReviewers(true, search);
  const startConversation = useStartConversation();

  const societies = useMemo(() => {
    const grouped = new Map<string, { name: string; logoUrl?: string | null; reviewers: SocietyReviewer[] }>();
    reviewers.forEach((reviewer) => {
      const society = grouped.get(reviewer.communityId) ?? {
        name: reviewer.communityName,
        logoUrl: reviewer.communityLogoUrl,
        reviewers: [],
      };
      society.reviewers.push(reviewer);
      grouped.set(reviewer.communityId, society);
    });
    return [...grouped.entries()];
  }, [reviewers]);

  const messageReviewer = (reviewer: SocietyReviewer) => {
    startConversation.mutate(
      { recipientId: reviewer.userId },
      {
        onSuccess: (detail) => navigate(`/messages/${detail.conversation.id}`),
        onError: (error: any) => {
          toast({
            title: "Could not start chat",
            description: error?.message ?? "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="portal-soft-rule overflow-hidden rounded-3xl border bg-card/72 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b portal-soft-rule p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck size={18} />
                <span className="text-xs font-black uppercase tracking-[0.16em]">Trusted network</span>
              </div>
              <h1 className="mt-2 text-2xl font-black text-foreground">Reviewers Panel</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Find approved administrators and moderators across Mohalla societies, then open a private conversation.
              </p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reviewer or society"
                aria-label="Search reviewers"
                className="h-11 w-full rounded-xl border portal-soft-rule bg-background/78 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading society reviewers...
              </div>
            ) : isError ? (
              <div className="flex min-h-56 items-center justify-center text-sm text-destructive">
                Reviewers could not be loaded.
              </div>
            ) : societies.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                <Users className="h-9 w-9 text-muted-foreground/45" />
                <p className="mt-3 font-bold text-foreground">No reviewers found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try another name or society.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {societies.map(([communityId, society]) => (
                  <article key={communityId} className="rounded-2xl border portal-soft-rule bg-background/58 p-4">
                    <header className="mb-3 flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                        {society.logoUrl ? (
                          <img src={society.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 size={20} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-black text-foreground">{society.name}</h2>
                        <p className="text-xs text-muted-foreground">
                          {society.reviewers.length} {society.reviewers.length === 1 ? "reviewer" : "reviewers"}
                        </p>
                      </div>
                    </header>

                    <div className="space-y-2">
                      {society.reviewers.map((reviewer) => (
                        <div key={reviewer.userId} className="flex items-center gap-3 rounded-xl border portal-soft-rule bg-card/82 p-3">
                          <UserAvatar name={reviewerName(reviewer)} src={reviewer.avatarUrl} className="h-10 w-10 rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-foreground">{reviewerName(reviewer)}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {reviewer.role === "admin" ? "Administrator" : "Moderator"}
                              {reviewer.unitNumber ? ` · ${reviewer.unitNumber}` : ""}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            disabled={startConversation.isPending || reviewer.userId === currentUser?.userId}
                            onClick={() => messageReviewer(reviewer)}
                          >
                            <MessageCircle size={15} />
                            {reviewer.userId === currentUser?.userId ? "You" : "Message"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
