import { cn } from '@/lib/utils'

export function TimelineRow({
  icon: Icon,
  title,
  description,
  meta,
  tone = 'bg-primary/10 text-primary',
  unread,
  onClick,
}: {
  icon: React.ElementType
  title: string
  description?: string
  meta?: string
  tone?: string
  unread?: boolean
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
        onClick && 'hover:bg-secondary/55',
        unread && 'bg-primary/10',
      )}
    >
      <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tone)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={cn('min-w-0 flex-1 truncate text-sm leading-snug', unread ? 'font-black text-foreground' : 'font-bold text-foreground')}>
            {title}
          </p>
          {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </div>
        {description && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>}
        {meta && <p className="mt-1 text-xs font-medium text-muted-foreground/70">{meta}</p>}
      </div>
    </Comp>
  )
}
