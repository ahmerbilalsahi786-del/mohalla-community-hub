import { useState } from 'react'
import {
  useListPolls, useCreatePoll, useVotePoll,
  getListPollsQueryKey,
} from '@/lib/generated/api'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { BarChart2, Plus, X, Clock, Users, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PublicationToggle } from '@/components/city-feed/publication-toggle'
import { UserAvatar } from '@/components/community/user-avatar'

type PollResult = {
  id: number; question: string; options: string[]; totalVotes: number;
  voteCounts: number[]; myVoteIndex: number | null; isEnded: boolean;
  endsAt: string; createdAt: string; userName: string; unitNumber: string;
  avatarUrl?: string | null;
}

function timeLeft(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const h = Math.floor(ms / 3600000)
  if (h < 24) return `${h}h left`
  return `${Math.floor(h / 24)}d left`
}
function pct(votes: number, total: number) {
  return total === 0 ? 0 : Math.round((votes / total) * 100)
}

function PollCard({ poll }: { poll: PollResult }) {
  const qc = useQueryClient()
  const vote = useVotePoll({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListPollsQueryKey() }),
    },
  })

  const hasVoted = poll.myVoteIndex !== null
  const showResults = hasVoted || poll.isEnded

  return (
    <div className={cn(
      'rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md',
      poll.isEnded ? 'opacity-70 border-border' : 'border-border hover:border-primary/30'
    )}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold text-foreground leading-snug">{poll.question}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <UserAvatar name={poll.userName} src={poll.avatarUrl} className="h-7 w-7" fallbackClassName="text-[10px]" />
            <span>By {poll.userName} · {poll.unitNumber}</span>
          </div>
        </div>
        <span className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
          poll.isEnded
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/10 text-primary'
        )}>
          {poll.isEnded ? 'Ended' : timeLeft(poll.endsAt)}
        </span>
      </div>

      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const p = pct(poll.voteCounts[i] ?? 0, poll.totalVotes)
          const isMyVote = poll.myVoteIndex === i
          const isWinner = poll.isEnded && (poll.voteCounts[i] ?? 0) === Math.max(...poll.voteCounts)

          if (showResults) {
            return (
              <div key={i} className="relative">
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30 px-4 py-2.5">
                  <div
                    className={cn(
                      'absolute inset-0 rounded-xl transition-all',
                      isMyVote ? 'bg-primary/20' : isWinner ? 'bg-green-500/10' : 'bg-muted/50'
                    )}
                    style={{ width: `${p}%` }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isMyVote && <CheckCircle2 size={12} className="text-primary shrink-0" />}
                      <span className={cn('text-sm', isMyVote ? 'font-semibold text-primary' : 'text-foreground')}>
                        {opt}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground ml-4 shrink-0">
                      {p}% · {poll.voteCounts[i] ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <button
              key={i}
              onClick={() => vote.mutate({ pollId: poll.id, data: { optionIndex: i } })}
              disabled={vote.isPending || poll.isEnded}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-left text-sm text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all font-medium"
            >
              {opt}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users size={11} />
          <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
        </div>
        {hasVoted && !poll.isEnded && (
          <span className="text-primary font-medium flex items-center gap-1">
            <CheckCircle2 size={11} /> You voted
          </span>
        )}
        <PublicationToggle sourceType="poll" sourceId={poll.id} variant="chip" className="ml-auto" />
      </div>
    </div>
  )
}

function CreatePollModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [question, setQuestion] = useState('')
  const [options, setOptions]   = useState(['', ''])
  const [duration, setDuration] = useState('24')  // hours

  const create = useCreatePoll({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPollsQueryKey() })
        onClose()
      },
    },
  })

  const cleanOpts = options.filter(o => o.trim())

  const addOption = () => setOptions(p => [...p, ''])
  const removeOption = (i: number) => setOptions(p => p.filter((_, j) => j !== i))
  const updateOption = (i: number, v: string) => setOptions(p => p.map((o, j) => j === i ? v : o))

  return (
    <div data-mobile-composer role="dialog" aria-modal="true" aria-label="Create a community poll" className="fixed inset-0 z-[80] flex items-stretch justify-center overflow-hidden bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-dvh min-h-0 w-full max-w-lg flex-col overflow-hidden border-0 border-border bg-card shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Create Poll</h2>
          <button onClick={onClose} aria-label="Close poll form" className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Question *</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2}
              placeholder="e.g. What time should we hold the community meeting?"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Options *</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={opt} onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button onClick={addOption} className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                <Plus size={14} /> Add option
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Poll Duration</label>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground shrink-0" />
              <select value={duration} onChange={e => setDuration(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors">
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">1 day</option>
                <option value="48">2 days</option>
                <option value="72">3 days</option>
                <option value="168">1 week</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/20 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() => {
              const endsAt = new Date(Date.now() + +duration * 3600000).toISOString()
              create.mutate({ data: { question: question.trim(), options: cleanOpts, endsAt } })
            }}
            disabled={!question.trim() || cleanOpts.length < 2 || create.isPending}
            className="rounded-xl gap-2"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
            Create Poll
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Polls() {
  const [showCreate, setShowCreate] = useState(false)
  const { data, isLoading } = useListPolls({ communityId: 'default', userId: 'ahmed' })

  const active = (data as any)?.active ?? []
  const ended = (data as any)?.ended ?? []

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Polls</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{active.length} active poll{active.length !== 1 ? 's' : ''}</p>
              </div>
              <Button onClick={() => setShowCreate(true)} className="w-full gap-2 rounded-xl sm:w-auto">
                <Plus size={16} /> Create Poll
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-8">
                {active.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Polls</h3>
                    <div className="space-y-4">
                      {active.map((p: PollResult) => <PollCard key={p.id} poll={p} />)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                      <BarChart2 size={28} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">No active polls</h3>
                    <p className="text-sm text-muted-foreground mt-1">Ask your community a question to get their opinion.</p>
                    <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2 rounded-xl" size="sm">
                      <Plus size={14} /> Create Poll
                    </Button>
                  </div>
                )}

                {ended.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Past Polls</h3>
                    <div className="space-y-4">
                      {ended.map((p: PollResult) => <PollCard key={p.id} poll={p} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 md:bottom-8 md:right-8"
      >
        <Plus size={24} />
      </button>

      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
