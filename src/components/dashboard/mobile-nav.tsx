import { Link, useLocation } from 'wouter'
import { MessageSquare, ShoppingBag, ShieldAlert, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Feed',    icon: MessageSquare, href: '/feed' },
  { label: 'Market',  icon: ShoppingBag,   href: '/marketplace' },
  { label: 'Safety',  icon: ShieldAlert,   href: '/safety' },
  { label: 'Events',  icon: Calendar,      href: '/events' },
  { label: 'Profile', icon: User,          href: '/profile/ahmed' },
]

export function MobileNav() {
  const [location] = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-md md:hidden">
      {NAV.map((item) => {
        const active = location === item.href || (item.href !== '/' && location.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center justify-center gap-0.5">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
              active ? 'bg-primary/10' : ''
            )}>
              <Icon size={20} className={active ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <span className={cn('text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
