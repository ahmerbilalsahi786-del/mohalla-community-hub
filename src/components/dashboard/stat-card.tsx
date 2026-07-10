import { cn } from '@/lib/utils'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
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
    <div className={cn('group delight-hover-lift relative min-h-[142px] overflow-hidden rounded-xl border portal-soft-rule bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30', href && 'cursor-pointer')}>
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-card-foreground">{title}</p>
          <p className="mt-3 break-words text-3xl font-black tracking-tight text-card-foreground">{value}</p>
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
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('delight-swing-on-hover flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', iconColor)}>
          <Icon size={24} />
        </div>
      </div>
      {href && (
        <div className="absolute bottom-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight size={14} />
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return (
    content
  )
}
