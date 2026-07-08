import { Activity, CalendarDays, CheckCircle2, ShieldCheck, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'

type BreakdownItem = {
  label: string
  value: number
  detail: string
  icon: React.ElementType
  color: string
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function HealthScoreCard({
  postsThisMonth,
  activeSafetyAlerts,
  resolvedComplaints,
  upcomingEvents,
  verifiedResidents,
  className,
}: {
  postsThisMonth: number
  activeSafetyAlerts: number
  resolvedComplaints: number
  upcomingEvents: number
  verifiedResidents: number
  className?: string
}) {
  const safety = clampScore(96 - activeSafetyAlerts * 14)
  const activity = clampScore(48 + postsThisMonth * 7)
  const resolved = clampScore(72 + resolvedComplaints * 7)
  const events = clampScore(52 + upcomingEvents * 12)
  const residents = clampScore(verifiedResidents >= 20 ? 96 : 50 + verifiedResidents * 2.2)
  const score = clampScore(safety * 0.28 + activity * 0.22 + resolved * 0.16 + events * 0.16 + residents * 0.18)

  const breakdown: BreakdownItem[] = [
    { label: 'Safety', value: safety, detail: activeSafetyAlerts ? `${activeSafetyAlerts} active alert${activeSafetyAlerts === 1 ? '' : 's'}` : 'No active alerts', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Activity', value: activity, detail: `${postsThisMonth} updates this month`, icon: Activity, color: 'text-primary bg-primary/10' },
    { label: 'Resolved Complaints', value: resolved, detail: `${resolvedComplaints} recently resolved`, icon: CheckCircle2, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Events', value: events, detail: `${upcomingEvents} upcoming`, icon: CalendarDays, color: 'text-amber-600 bg-amber-500/10' },
    { label: 'Verified Residents', value: residents, detail: `${verifiedResidents} connected`, icon: UsersRound, color: 'text-violet-600 bg-violet-500/10' },
  ]

  return (
    <section className={cn('overflow-hidden rounded-xl border portal-soft-rule bg-card p-5 shadow-sm premium-card', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">Mohalla Health Score</p>
          <h3 className="mt-1 text-lg font-black text-foreground">Community trust and momentum</h3>
        </div>
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-secondary">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(var(--primary) ${score * 3.6}deg, color-mix(in oklch, var(--muted) 70%, transparent) 0deg)`,
            }}
          />
          <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card shadow-sm">
            <span className="text-3xl font-black text-foreground">{score}</span>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">/ 100</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {breakdown.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-bold text-foreground">{item.label}</p>
                  <span className="text-xs font-black text-muted-foreground">{item.value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.value}%` }} />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
