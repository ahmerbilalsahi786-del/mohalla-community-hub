import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { Heart, Clock, Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Opportunity = {
  id: number
  title: string
  description: string
  date: string
  time: string
  spots: number
  joined: number
  category: string
}

const OPPORTUNITIES: Opportunity[] = [
  {
    id: 1,
    title: 'Park Cleanup Drive',
    description: 'Help us clean and beautify Central Park. Gloves and bags provided.',
    date: 'Sat, Jun 7',
    time: '7:00 AM – 10:00 AM',
    spots: 20,
    joined: 12,
    category: 'Environment',
  },
  {
    id: 2,
    title: 'Food Distribution',
    description: 'Monthly food drive for underprivileged families near the mohalla.',
    date: 'Sun, Jun 8',
    time: '10:00 AM – 1:00 PM',
    spots: 10,
    joined: 6,
    category: 'Social',
  },
  {
    id: 3,
    title: 'Senior Residents Help',
    description: 'Assist elderly residents with groceries, errands, and tech support.',
    date: 'Every Saturday',
    time: '3:00 PM – 5:00 PM',
    spots: 5,
    joined: 2,
    category: 'Care',
  },
  {
    id: 4,
    title: 'Kids Tutoring Session',
    description: 'Volunteer tutors needed for primary school students at the Learning Centre.',
    date: 'Mon & Wed',
    time: '4:00 PM – 6:00 PM',
    spots: 8,
    joined: 4,
    category: 'Education',
  },
]

const CAT_COLORS: Record<string, string> = {
  Environment: 'bg-green-100 text-green-700',
  Social:      'bg-blue-100 text-blue-700',
  Care:        'bg-rose-100 text-rose-700',
  Education:   'bg-indigo-100 text-indigo-700',
}

export default function Volunteer() {
  const [joined, setJoined] = useState<number[]>([])

  const toggle = (id: number) =>
    setJoined((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  return (
    <div className="flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Volunteer Opportunities</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Give back to your community</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10">
                <Heart size={22} className="text-rose-500" />
              </div>
            </div>

            {/* Stats bar */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Active drives',   value: OPPORTUNITIES.length },
                { label: 'Spots available', value: OPPORTUNITIES.reduce((s, o) => s + (o.spots - o.joined), 0) },
                { label: 'You joined',      value: joined.length },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Opportunity cards */}
            <div className="space-y-4">
              {OPPORTUNITIES.map((opp) => {
                const isJoined = joined.includes(opp.id)
                const full = opp.joined >= opp.spots
                const catCls = CAT_COLORS[opp.category] ?? 'bg-muted text-muted-foreground'
                const pct = Math.round((opp.joined / opp.spots) * 100)
                return (
                  <div key={opp.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                        <Heart size={20} className="text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-foreground">{opp.title}</h3>
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', catCls)}>{opp.category}</span>
                          {isJoined && (
                            <span className="flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
                              <CheckCircle2 size={11} /> Joined
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{opp.description}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={12} /> {opp.date} · {opp.time}</span>
                          <span className="flex items-center gap-1"><Users size={12} /> {opp.joined}/{opp.spots} signed up</span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        disabled={full && !isJoined}
                        onClick={() => toggle(opp.id)}
                        className={cn(
                          'rounded-xl',
                          isJoined
                            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : full
                              ? 'opacity-50 cursor-not-allowed'
                              : 'bg-primary text-primary-foreground'
                        )}
                      >
                        {isJoined ? 'Leave' : full ? 'Full' : 'Join'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
