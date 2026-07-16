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
  compact?: boolean
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
  compact = false,
}: StatCardProps) {
  const content = (
    <div className={cn(
      'group delight-hover-lift relative overflow-hidden rounded-xl border portal-soft-rule bg-card shadow-sm transition-all duration-200 hover:border-primary/30',
      compact ? 'min-h-[110px] p-3' : 'min-h-[142px] p-5',
      href && 'cursor-pointer'
    )}>
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn('font-bold text-card-foreground', compact ? 'line-clamp-2 text-xs leading-tight' : 'text-sm')}>{title}</p>
          <p className={cn('break-words font-black tracking-tight text-card-foreground', compact ? 'mt-1.5 text-xl' : 'mt-3 text-3xl')}>{value}</p>
          {change && (
            <div className={cn('flex flex-wrap items-center gap-1', compact ? 'mt-1.5' : 'mt-2')}>
              <span
                className={cn(
                  'font-semibold',
                  compact ? 'text-xs' : 'text-sm',
                  changeType === 'positive' && 'text-green-600',
                  changeType === 'negative' && 'text-destructive',
                  changeType === 'neutral' && 'text-muted-foreground'
                )}
              >
                {change}
              </span>
              {description && <span className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>{description}</span>}
            </div>
          )}
          {!change && description && (
            <p className={cn('text-muted-foreground', compact ? 'mt-1 line-clamp-1 text-[11px] leading-snug' : 'mt-2 text-sm leading-relaxed')}>{description}</p>
          )}
        </div>
        <div className={cn(
          'delight-swing-on-hover flex shrink-0 items-center justify-center rounded-lg',
          compact ? 'h-8 w-8' : 'h-11 w-11',
          iconColor
        )}>
          <Icon size={compact ? 17 : 24} />
        </div>
      </div>
      {href && !compact && (
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
