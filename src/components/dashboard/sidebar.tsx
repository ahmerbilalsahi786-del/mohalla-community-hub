
import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import {
  Building2,
  Globe2,
  Home,
  Users,
  Calendar,
  MessageCircle,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Megaphone,
  ShoppingBag,
  Heart,
  ShieldAlert,
  ShieldCheck,
  BarChart2,
  LogOut,
  UserCircle,
} from 'lucide-react'
import { InstallAppButton } from '@/components/pwa/install-app'
import { canManageCommunity, useCurrentUser, useLogout } from '@/hooks/use-current-user'

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/dashboard', badge: null },
  { name: 'Community Feed', icon: MessageSquare, href: '/feed', badge: null },
  { name: 'Messages', icon: MessageCircle, href: '/messages', badge: null },
  { name: 'City Feed', icon: Globe2, href: '/city-feed', badge: null },
  { name: 'Safety & Alerts', icon: ShieldAlert, href: '/safety', badge: null },
  { name: 'Events', icon: Calendar, href: '/events', badge: null },
  { name: 'Polls', icon: BarChart2, href: '/polls', badge: null },
  { name: 'Community', icon: Users, href: '/community', badge: '12' },
  { name: 'Announcements', icon: Megaphone, href: '/announcements', badge: null },
  { name: 'Marketplace', icon: ShoppingBag, href: '/marketplace', badge: 'New' },
  { name: 'Places', icon: MapPin, href: '/places', badge: null },
  { name: 'Volunteer', icon: Heart, href: '/volunteer', badge: null },
  { name: 'Admin Panel', icon: ShieldCheck, href: '/admin', badge: null },
]

const utilityItems = [
  { name: 'Profile', icon: UserCircle, href: '/profile/me', badge: null },
  { name: 'Settings', icon: Settings, href: '/settings', badge: null },
  { name: 'Help', icon: HelpCircle, href: '/help', badge: null },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [location] = useLocation()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const profileHref = `/profile/${user?.userId ?? 'me'}`
  const logoUrl = user?.community?.logoUrl
  const societyName = user?.community?.name?.trim() || 'Mohalla'
  const visibleNavItems = navItems.filter((item) => item.href !== '/admin' || canManageCommunity(user?.role))
  const visibleUtilityItems = utilityItems.map((item) => item.href === '/profile/me' ? { ...item, href: profileHref } : item)

  const activeItem =
    [...visibleNavItems, ...visibleUtilityItems].find((i) => location === i.href || location.startsWith(`${i.href}/`))?.name ??
    'Dashboard'

  return (
    <aside
      className={cn(
        'sticky top-0 relative flex h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[12px_0_36px_rgba(15,23,42,0.04)] transition-all duration-300 ease-in-out self-start',
        'hidden md:flex',
        collapsed ? 'w-20' : 'w-[17rem]'
      )}
    >
      {/* Logo Section */}
      <div className="flex min-h-20 items-center justify-between border-b border-sidebar-border bg-card/92 px-4 shadow-sm">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 p-0.5 text-primary shadow-sm ring-1 ring-primary/15">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-full w-full rounded-[10px] object-cover" />
            ) : (
              <Building2 size={22} />
            )}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <span className="brand-wordmark block truncate text-xl">{societyName}</span>
              <span className="text-xs font-semibold text-muted-foreground">Neighborhood Portal</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sidebar-border bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className={cn('mb-3 px-3 text-[11px] font-black uppercase text-muted-foreground', collapsed && 'sr-only')}>
          Main Menu
        </div>
        {visibleNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200',
              activeItem === item.name
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            {activeItem === item.name && (
              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
            )}
            <item.icon size={20} className={cn(
              'shrink-0 transition-colors',
              activeItem === item.name ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
            )} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {item.badge && (
                  <span className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black',
                    item.badge === 'New' 
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-background/20 text-primary-foreground'
                  )}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}

        <div className="my-3 border-t border-sidebar-border" />
        <InstallAppButton collapsed={collapsed} className="mb-1" />
        {visibleUtilityItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200',
              activeItem === item.name
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
        <button
          type="button"
          onClick={logout}
          className={cn(
            'group mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </nav>
    </aside>
  )
}
