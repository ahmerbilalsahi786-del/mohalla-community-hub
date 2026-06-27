import { Link, useLocation } from 'wouter'
import { Home, MessageSquare, ShoppingBag, ShieldAlert, Calendar, Menu, Users, Megaphone, MapPin, Heart, BarChart2, Settings, HelpCircle, ShieldCheck, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { InstallAppButton } from '@/components/pwa/install-app'
import { canManageCommunity, useCurrentUser, useLogout } from '@/hooks/use-current-user'

const NAV = [
  { label: 'Home',    icon: Home,          href: '/dashboard' },
  { label: 'Feed',    icon: MessageSquare, href: '/feed' },
  { label: 'Market',  icon: ShoppingBag,   href: '/marketplace' },
  { label: 'Safety',  icon: ShieldAlert,   href: '/safety' },
  { label: 'Events',  icon: Calendar,      href: '/events' },
]

const MORE_LINKS = [
  { label: 'Profile', icon: Users, href: '/profile/me' },
  { label: 'Polls', icon: BarChart2, href: '/polls' },
  { label: 'Community', icon: Users, href: '/community' },
  { label: 'Announcements', icon: Megaphone, href: '/announcements' },
  { label: 'Places', icon: MapPin, href: '/places' },
  { label: 'Volunteer', icon: Heart, href: '/volunteer' },
  { label: 'Admin', icon: ShieldCheck, href: '/admin' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Help', icon: HelpCircle, href: '/help' },
]

export function MobileNav() {
  const [location] = useLocation()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const profileHref = `/profile/${user?.userId ?? 'me'}`
  const moreLinks = MORE_LINKS
    .map((item) => item.label === 'Profile' ? { ...item, href: profileHref } : item)
    .filter((item) => item.href !== '/admin' || canManageCommunity(user?.role))

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      {NAV.map((item) => {
        const active = location === item.href || (item.href !== '/' && location.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className="flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-xl transition-colors sm:h-8 sm:w-8',
              active ? 'bg-primary/10' : ''
            )}>
              <Icon size={18} className={active ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <span className={cn('truncate text-[9px] font-medium sm:text-[10px]', active ? 'text-primary' : 'text-muted-foreground')}>
              {item.label}
            </span>
          </Link>
        )
      })}
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-xl transition-colors sm:h-8 sm:w-8',
              moreLinks.some((item) => location === item.href || (item.href !== '/' && location.startsWith(item.href))) ? 'bg-primary/10' : ''
            )}>
              <Menu size={18} className={moreLinks.some((item) => location === item.href || (item.href !== '/' && location.startsWith(item.href))) ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <span className={cn('truncate text-[9px] font-medium sm:text-[10px]', moreLinks.some((item) => location === item.href || (item.href !== '/' && location.startsWith(item.href))) ? 'text-primary' : 'text-muted-foreground')}>
              More
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>More</SheetTitle>
            <SheetDescription>Shortcuts for the pages available from the desktop sidebar.</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4">
            <InstallAppButton variant="mobile" />
            {moreLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </Link>
              )
            })}
            <button onClick={logout} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-medium text-foreground">Logout</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
