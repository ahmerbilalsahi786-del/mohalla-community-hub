import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Home, MessageSquare, ShoppingBag, ShieldAlert, Calendar, Menu, Users, Megaphone, MapPin, Heart, BarChart2, Settings, HelpCircle, ShieldCheck, LogOut, Globe2, UserCircle, ChevronDown, UserRoundCheck } from 'lucide-react'
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
  { label: 'City Feed', icon: Globe2, href: '/city-feed' },
  { label: 'Polls', icon: BarChart2, href: '/polls' },
  { label: 'Community', icon: Users, href: '/community' },
  { label: 'Announcements', icon: Megaphone, href: '/announcements' },
  { label: 'Places', icon: MapPin, href: '/places' },
  { label: 'Volunteer', icon: Heart, href: '/volunteer' },
]

export function MobileNav() {
  const [location] = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const [profileTrayOpen, setProfileTrayOpen] = useState(false)
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const profileHref = `/profile/${user?.userId ?? 'me'}`
  const moreLinks = MORE_LINKS
  const isManager = canManageCommunity(user?.role)
  const profileDestinations = [profileHref, '/settings', '/help', '/admin', '/reviewers']
  const moreIsActive =
    moreLinks.some((item) => location === item.href || (item.href !== '/' && location.startsWith(item.href))) ||
    profileDestinations.some((href) => location === href || location.startsWith(`${href}/`))

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_28px_rgba(15,23,42,0.06)] backdrop-blur-md md:hidden">
      {NAV.map((item) => {
        const active = location === item.href || (item.href !== '/' && location.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} className="flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-colors sm:h-8 sm:w-8',
              active ? 'bg-primary text-primary-foreground shadow-sm' : ''
            )}>
              <Icon size={18} className={active ? 'text-primary-foreground' : 'text-muted-foreground'} />
            </div>
            <span className={cn('truncate text-[9px] font-bold sm:text-[10px]', active ? 'text-primary' : 'text-muted-foreground')}>
              {item.label}
            </span>
          </Link>
        )
      })}
      <Sheet
        open={moreOpen}
        onOpenChange={(open) => {
          setMoreOpen(open)
          if (!open) setProfileTrayOpen(false)
        }}
      >
        <SheetTrigger asChild>
          <button className="flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5">
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg transition-colors sm:h-8 sm:w-8',
              moreIsActive ? 'bg-primary text-primary-foreground shadow-sm' : ''
            )}>
              <Menu size={18} className={moreIsActive ? 'text-primary-foreground' : 'text-muted-foreground'} />
            </div>
            <span className={cn('truncate text-[9px] font-bold sm:text-[10px]', moreIsActive ? 'text-primary' : 'text-muted-foreground')}>
              More
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-2xl px-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>More</SheetTitle>
            <SheetDescription>Mohalla Community Portal</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <button
              type="button"
              aria-expanded={profileTrayOpen}
              aria-controls="mobile-profile-tray"
              onClick={() => setProfileTrayOpen((open) => !open)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-xs transition-colors hover:bg-secondary/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserCircle size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-foreground">Profile</span>
                <span className="block truncate text-xs text-muted-foreground">Account and access</span>
              </div>
              <ChevronDown size={18} className={cn('text-muted-foreground transition-transform', profileTrayOpen && 'rotate-180')} />
            </button>

            {profileTrayOpen && (
              <div id="mobile-profile-tray" className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary/35 p-2">
                <Link href={profileHref} onClick={() => setMoreOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-semibold text-foreground">
                  <UserCircle size={16} className="text-primary" />
                  View Profile
                </Link>
                <Link href="/settings" onClick={() => setMoreOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-semibold text-foreground">
                  <Settings size={16} className="text-primary" />
                  Settings
                </Link>
                <Link href="/help" onClick={() => setMoreOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-semibold text-foreground">
                  <HelpCircle size={16} className="text-primary" />
                  Help
                </Link>
                {isManager && (
                  <>
                    <Link href="/admin" onClick={() => setMoreOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-semibold text-foreground">
                      <ShieldCheck size={16} className="text-primary" />
                      Admin Panel
                    </Link>
                    <Link href="/reviewers" onClick={() => setMoreOpen(false)} className="col-span-2 flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm font-semibold text-foreground">
                      <UserRoundCheck size={16} className="text-primary" />
                      Reviewers Panel
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    logout()
                  }}
                  className="col-span-2 flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 py-2 text-left text-sm font-semibold text-destructive"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 px-4">
            <InstallAppButton variant="mobile" />
            {moreLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs transition-colors hover:bg-secondary/60"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
