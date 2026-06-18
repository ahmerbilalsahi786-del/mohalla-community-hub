import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Route as AuthLayout } from "@/routes/_authenticated/route";

interface PollOption { id: string; option_text: string; votes_count: number | null }
interface Poll {
  id: string;
  user_id: string;
  question: string;
  description: string | null;
  is_active: boolean;
  total_votes: number | null;
  created_at: string;
  poll_options: PollOption[];
}

function CreatePollModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const cleanOpts = options.map((o) => o.trim()).filter(Boolean);
      if (cleanOpts.length < 2) throw new Error("Need at least 2 options");
      const { data: poll, error } = await supabase.from("polls").insert({
        user_id: userId,
        question: question.trim(),
        description: description.trim() || null,
        is_active: true,
      }).select("id").single();
      if (error) throw error;
      const { error: oErr } = await supabase.from("poll_options").insert(
        cleanOpts.map((option_text) => ({ poll_id: poll.id, option_text }))
      );
      if (oErr) throw oErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["polls"] }); onClose(); },
    onError: (e: Error) => toast({ title: "Could not create poll", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold">Create Poll</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question"
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description (optional)"
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm resize-none" />
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input value={opt} onChange={(e) => setOptions(options.map((o, idx) => idx === i ? e.target.value : o))}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
                {options.length > 2 && (
                  <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                    className="rounded-lg px-2 hover:bg-muted text-muted-foreground"><X size={14} /></button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button onClick={() => setOptions([...options, ""])} className="text-sm text-primary font-medium">+ Add option</button>
            )}
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()}
            disabled={question.trim().length < 3 || options.filter((o) => o.trim()).length < 2 || create.isPending}>
            {create.isPending ? "Creating…" : "Create Poll"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PollsPage() {
  const { user } = AuthLayout.useRouteContext();
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: polls = [], isLoading, error } = useQuery({
    queryKey: ["polls"],
    queryFn: async (): Promise<Poll[]> => {
      const { data, error } = await supabase.from("polls")
        .select("id, user_id, question, description, is_active, total_votes, created_at, poll_options(id, option_text, votes_count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Poll[]) ?? [];
    },
  });

  const { data: myVotes = new Map<string, string>() } = useQuery({
    queryKey: ["my-votes", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("poll_votes").select("poll_id, option_id").eq("user_id", user.id);
      if (error) throw error;
      const m = new Map<string, string>();
      (data ?? []).forEach((v) => m.set(v.poll_id as string, v.option_id as string));
      return m;
    },
  });

  const vote = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      const { error } = await supabase.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["polls"] });
      qc.invalidateQueries({ queryKey: ["my-votes", user.id] });
    },
    onError: (e: Error) => toast({ title: "Could not vote", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Polls</h2>
            <p className="text-sm text-muted-foreground">Vote on community decisions.</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto"><Plus size={16} className="mr-1.5" />New Poll</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive">{(error as Error).message}</div>
      ) : polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 size={40} className="text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold">No polls yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Start the first poll!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const myChoice = myVotes.get(poll.id);
            const total = poll.total_votes ?? 0;
            return (
              <div key={poll.id} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="font-semibold">{poll.question}</h3>
                {poll.description && <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>}
                <div className="mt-3 space-y-2">
                  {poll.poll_options.map((opt) => {
                    const votes = opt.votes_count ?? 0;
                    const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                    const isMyChoice = myChoice === opt.id;
                    const voted = !!myChoice;
                    return (
                      <button key={opt.id}
                        onClick={() => !voted && vote.mutate({ pollId: poll.id, optionId: opt.id })}
                        disabled={voted || vote.isPending}
                        className={cn(
                          "relative w-full text-left rounded-xl border border-border px-3 py-2 text-sm overflow-hidden",
                          !voted && "hover:border-primary hover:bg-primary/5 cursor-pointer",
                          isMyChoice && "border-primary",
                        )}>
                        {voted && (
                          <div className={cn("absolute inset-y-0 left-0", isMyChoice ? "bg-primary/15" : "bg-muted")}
                            style={{ width: `${pct}%` }} />
                        )}
                        <div className="relative flex items-center justify-between gap-3">
                          <span className={cn("min-w-0 break-words font-medium", isMyChoice && "text-primary")}>{opt.option_text}</span>
                          {voted && <span className="text-xs text-muted-foreground">{pct}% · {votes}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{total} vote{total === 1 ? "" : "s"}</p>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} userId={user.id} />}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/polls")({
  head: () => ({ meta: [{ title: "Polls — Mohalla" }, { name: "description", content: "Vote on community decisions." }] }),
  component: PollsPage,
});
