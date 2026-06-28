import { Plus, Calendar, Megaphone, ShoppingBag, Users, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocation } from 'wouter'

const actions = [
  {
    name: 'Create Post',
    icon: Plus,
    color: 'bg-primary/10 text-primary hover:bg-primary/20',
    description: 'Share with community',
    href: '/feed?compose=1',
  },
  {
    name: 'New Event',
    icon: Calendar,
    color: 'bg-accent/10 text-accent hover:bg-accent/20',
    description: 'Organize gathering',
    href: '/events',
  },
  {
    name: 'Announcement',
    icon: Megaphone,
    color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
    description: 'Important updates',
    href: '/feed?compose=1&type=announcement',
  },
  {
    name: 'List Item',
    icon: ShoppingBag,
    color: 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20',
    description: 'Sell or buy',
    href: '/marketplace',
  },
  {
    name: 'Find People',
    icon: Users,
    color: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20',
    description: 'Connect with neighbors',
    href: '/community',
  },
  {
    name: 'Add Place',
    icon: MapPin,
    color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
    description: 'Recommend spots',
    href: '/places',
  },
]

export function QuickActions() {
  const [, navigate] = useLocation()

  return (
    <div className="portal-panel relative overflow-hidden rounded-2xl p-5">
      <div className="relative">
        <h3 className="portal-section-title text-lg text-card-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Jump into the next thing your neighborhood needs.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.name}
              onClick={() => navigate(action.href)}
              className={cn(
                'group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-transparent p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg',
                action.color
              )}
            >
              <action.icon
                size={24}
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <div>
                <p className="text-sm font-black leading-tight">{action.name}</p>
                <p className="text-xs leading-tight opacity-70">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
