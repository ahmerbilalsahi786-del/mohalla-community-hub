import { Link } from 'wouter'
import { useListAlerts } from '@/lib/generated/api'
import { AlertTriangle, Flame, ShieldAlert, Zap, Droplets, HelpCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<string, React.ElementType> = {
  theft: ShieldAlert,
  suspicious: AlertTriangle,
  emergency: Flame,
  power_outage: Zap,
  water_shortage: Droplets,
  other: HelpCircle,
}

const SEVERITY: Record<string, { bg: string; text: string; dot: string }> = {
  high:   { bg: 'bg-red-500/10',   text: 'text-red-600',   dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-700', dot: 'bg-amber-400' },
  low:    { bg: 'bg-green-500/10', text: 'text-green-700', dot: 'bg-green-500' },
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function SafetyWidget() {
  const { data: alerts = [], isLoading } = useListAlerts({ communityId: 'default' })
  const active = (alerts as any[]).filter((a) => !a.isResolved)
  const latest = active[0]

  return (
    <Link href="/safety">
      <div className="portal-panel group cursor-pointer rounded-2xl p-4 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              active.length > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
            )}>
              <ShieldAlert size={18} className={active.length > 0 ? 'text-red-500' : 'text-green-600'} />
            </div>
            <h3 className="font-semibold text-sm text-foreground">Safety</h3>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        {isLoading ? (
          <div className="h-8 rounded-lg bg-muted animate-pulse" />
        ) : active.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 size={16} />
            <span className="font-medium">All clear</span>
            <span className="text-muted-foreground">· No active alerts</span>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <span className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                active.length > 0 ? 'bg-red-500' : 'bg-green-500'
              )}>
                {active.length}
              </span>
              <span className="text-sm font-medium text-foreground">
                active alert{active.length !== 1 ? 's' : ''}
              </span>
            </div>

            {latest && (() => {
              const TypeIcon = TYPE_ICON[latest.type] || HelpCircle
              const sev = SEVERITY[latest.severity] || SEVERITY.medium
              return (
                <div className={cn('flex items-start gap-2 rounded-xl p-2.5', sev.bg)}>
                  <div className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full', sev.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold truncate', sev.text)}>{latest.title}</p>
                    {latest.locationDetail && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{latest.locationDetail}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(latest.createdAt)}</p>
                  </div>
                  <TypeIcon size={14} className={cn('shrink-0 mt-0.5', sev.text)} />
                </div>
              )
            })()}
          </>
        )}
      </div>
    </Link>
  )
}
