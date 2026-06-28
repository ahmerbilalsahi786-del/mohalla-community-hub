import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'wouter'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor?: string
  description?: string
  href?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
  description,
  href,
}: StatCardProps) {
  const content = (
    <div className={cn('portal-panel group relative overflow-hidden rounded-[1.7rem] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]', href && 'cursor-pointer')}>
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-background/80 to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p className="mt-3 truncate text-3xl font-black tracking-tight text-card-foreground">{value}</p>
          {change && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span
                className={cn(
                  'text-sm font-semibold',
                  changeType === 'positive' && 'text-green-600',
                  changeType === 'negative' && 'text-destructive',
                  changeType === 'neutral' && 'text-muted-foreground'
                )}
              >
                {change}
              </span>
              {description && <span className="text-sm text-muted-foreground">{description}</span>}
            </div>
          )}
          {!change && description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm', iconColor)}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return (
    content
  )
}
