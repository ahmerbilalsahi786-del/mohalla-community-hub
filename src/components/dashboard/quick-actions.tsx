import { Plus, Calendar, Megaphone, ShoppingBag, Users, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocation } from 'wouter'

const actions = [
  {
    name: 'Create Post',
    icon: Plus,
    color: 'text-primary',
    description: 'Share an update',
    href: '/feed?compose=1',
  },
  {
    name: 'New Event',
    icon: Calendar,
    color: 'text-accent',
    description: 'Organize gathering',
    href: '/events',
  },
  {
    name: 'Announcement',
    icon: Megaphone,
    color: 'text-amber-600 dark:text-amber-300',
    description: 'Important updates',
    href: '/feed?compose=1&type=announcement',
  },
  {
    name: 'List Item',
    icon: ShoppingBag,
    color: 'text-indigo-600 dark:text-indigo-300',
    description: 'Sell or give away',
    href: '/marketplace',
  },
  {
    name: 'Find People',
    icon: Users,
    color: 'text-pink-600 dark:text-pink-300',
    description: 'Connect with neighbors',
    href: '/community',
  },
  {
    name: 'Add Place',
    icon: MapPin,
    color: 'text-green-700 dark:text-green-300',
    description: 'Recommend spots',
    href: '/places',
  },
]

export function QuickActions() {
  const [, navigate] = useLocation()

  return (
    <div className="delight-hover-lift relative overflow-hidden rounded-xl border portal-soft-rule bg-card p-5 shadow-sm">
      <div className="relative">
        <h3 className="portal-section-title text-lg text-card-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Common community tasks in one place</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.name}
              onClick={() => navigate(action.href)}
              className={cn(
                'group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background/70 p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-secondary/55 hover:shadow-sm'
              )}
            >
              <span className={cn('delight-swing-on-hover flex h-10 w-10 items-center justify-center rounded-lg bg-card shadow-xs', action.color)}>
                <action.icon
                  size={22}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
              </span>
              <div>
                <p className="text-sm font-black leading-tight">{action.name}</p>
                <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
