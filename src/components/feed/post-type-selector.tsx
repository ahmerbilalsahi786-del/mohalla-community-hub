import { AlertTriangle, Calendar, Megaphone, MessageSquare, Search, Shield, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PostTypeOption = 'general' | 'announcement' | 'safety' | 'lost_found' | 'buy_sell' | 'event' | 'complaint'

const OPTIONS: Array<{ value: PostTypeOption; label: string; icon: React.ElementType; tone: string }> = [
  { value: 'general', label: 'Post', icon: MessageSquare, tone: 'text-primary bg-primary/10' },
  { value: 'announcement', label: 'Announcement', icon: Megaphone, tone: 'text-amber-700 bg-amber-500/10 dark:text-amber-300' },
  { value: 'safety', label: 'Safety', icon: Shield, tone: 'text-red-700 bg-red-500/10 dark:text-red-300' },
  { value: 'complaint', label: 'Complaint', icon: AlertTriangle, tone: 'text-red-800 bg-red-600/10 dark:text-red-200' },
  { value: 'lost_found', label: 'Lost & Found', icon: Search, tone: 'text-blue-700 bg-blue-500/10 dark:text-blue-300' },
  { value: 'buy_sell', label: 'Buy & Sell', icon: ShoppingBag, tone: 'text-green-700 bg-green-500/10 dark:text-green-300' },
  { value: 'event', label: 'Event', icon: Calendar, tone: 'text-accent bg-accent/10' },
]

export function PostTypeSelector({
  value,
  onChange,
}: {
  value: PostTypeOption
  onChange: (value: PostTypeOption) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left text-xs font-bold transition-all active:scale-[0.98]',
              active ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border bg-card text-muted-foreground hover:border-primary/35 hover:bg-secondary/45',
            )}
          >
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', active ? 'bg-primary text-primary-foreground' : option.tone)}>
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
