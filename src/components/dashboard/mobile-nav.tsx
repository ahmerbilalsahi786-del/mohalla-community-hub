import { Link, useLocation } from 'wouter'
import { Home, MessageSquare, ShoppingBag, ShieldAlert, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Home',    icon: Home,          href: '/' },
  { label: 'Feed',    icon: MessageSquare, href: '/feed' },
  { label: 'Market',  icon: ShoppingBag,   href: '/marketplace' },
  { label: 'Safety',  icon: ShieldAlert,   href: '/safety' },
  { label: 'Events',  icon: Calendar,      href: '/events' },
]

export function MobileNav() {
  const [location] = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      {NAV.map((item) => {
        const active = location === item.href || (item.href !== '/' && location.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className="flex h-16 flex-1 flex-col items-center justify-center gap-0.5">
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
