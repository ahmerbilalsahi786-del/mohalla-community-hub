import { cn } from '@/lib/utils'
import { Calendar, Heart, MessageSquare, PencilLine, UserPlus } from 'lucide-react'
import { Link } from 'wouter'

interface Activity {
  id: string
  user: string
  action: string
  target: string
  time: string
  avatar?: string
  type: 'event' | 'post' | 'join' | 'comment' | 'like'
}

interface ActivityCardProps {
  activities: Activity[]
}

const typeMeta = {
  event: { icon: Calendar, className: 'bg-accent/15 text-accent' },
  post: { icon: PencilLine, className: 'bg-primary/10 text-primary' },
  join: { icon: UserPlus, className: 'bg-green-500/10 text-green-700 dark:text-green-300' },
  comment: { icon: MessageSquare, className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  like: { icon: Heart, className: 'bg-pink-500/10 text-pink-700 dark:text-pink-300' },
}

export function ActivityCard({ activities }: ActivityCardProps) {
  return (
    <div className="delight-hover-lift relative overflow-hidden rounded-xl border portal-soft-rule bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b portal-soft-rule px-5 py-4">
        <div className="min-w-0">
          <h3 className="portal-section-title text-lg text-card-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">New posts and resident actions</p>
        </div>
        <Link href="/feed" className="shrink-0 text-sm font-bold text-primary hover:text-primary-hover">
          View all
        </Link>
      </div>

      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-semibold text-card-foreground">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">New updates will appear here as residents participate.</p>
          </div>
        ) : activities.map((activity) => {
          const meta = typeMeta[activity.type]
          const Icon = meta.icon

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-4 transition-colors hover:bg-secondary/45"
            >
              <div className={cn('delight-swing-on-hover flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', meta.className)}>
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm leading-relaxed text-card-foreground">
                  <span className="font-semibold">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                  <span className="font-medium text-primary">{activity.target}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
