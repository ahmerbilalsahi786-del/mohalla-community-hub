import { cn } from '@/lib/utils'
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

const typeColors = {
  event: 'bg-accent text-accent-foreground',
  post: 'bg-primary text-primary-foreground',
  join: 'bg-green-500 text-white',
  comment: 'bg-amber-500 text-white',
  like: 'bg-pink-500 text-white',
}

export function ActivityCard({ activities }: ActivityCardProps) {
  return (
    <div className="portal-panel relative overflow-hidden rounded-[1.9rem]">
      {/* Header */}
      <div className="flex items-center justify-between border-b portal-soft-rule px-6 py-5">
        <div>
          <h3 className="portal-section-title text-lg text-card-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">What&apos;s happening in your mohalla</p>
        </div>
        <Link href="/feed" className="text-sm font-black text-primary hover:text-primary/80">
          View all
        </Link>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No community activity yet.</p>
        ) : activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/40"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/65 via-accent/70 to-chart-3/70 shadow-md shadow-black/8" />
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs',
                  typeColors[activity.type]
                )}
              >
                {activity.type === 'event' && '📅'}
                {activity.type === 'post' && '📝'}
                {activity.type === 'join' && '👋'}
                {activity.type === 'comment' && '💬'}
                {activity.type === 'like' && '❤️'}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-card-foreground">
                <span className="font-semibold">{activity.user}</span>{' '}
                <span className="text-muted-foreground">{activity.action}</span>{' '}
                <span className="font-medium text-primary">{activity.target}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
