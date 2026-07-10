
import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import {
  Globe2,
  Home,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  HelpCircle,
  Landmark,
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
import { MohallaBrandMark } from '@/components/brand/mohalla-brand'
import { canManageCommunity, useCurrentUser, useLogout } from '@/hooks/use-current-user'

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/dashboard', badge: null },
  { name: 'Community Feed', icon: MessageSquare, href: '/feed', badge: null },
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
  const societyName = user?.community?.name?.trim() || 'Mohalla'
  const societyLogo = user?.community?.logoUrl
  const visibleNavItems = navItems.filter((item) => item.href !== '/admin' || canManageCommunity(user?.role))
  const visibleUtilityItems = utilityItems.map((item) => item.href === '/profile/me' ? { ...item, href: profileHref } : item)

  const activeItem =
    [...visibleNavItems, ...visibleUtilityItems].find((i) => location === i.href || location.startsWith(`${i.href}/`))?.name ??
    'Dashboard'

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[8px_0_24px_rgba(15,23,42,0.04)] transition-all duration-300 ease-in-out self-start md:flex',
        collapsed ? 'w-20' : 'w-[17rem]'
      )}
    >
      <div className="flex min-h-20 items-center justify-between border-b border-sidebar-border bg-sidebar px-4">
        <Link href="/dashboard" className={cn('flex min-w-0 items-center gap-3', collapsed && 'mx-auto')}>
          <MohallaBrandMark animated className="h-11 w-11 rounded-xl shadow-sm ring-1 ring-primary/15" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <span className="brand-wordmark block truncate text-xl text-sidebar-foreground">Mohalla</span>
              <span className="block truncate text-xs font-semibold text-muted-foreground">Community Portal</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
            collapsed && 'hidden'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="mx-3 mt-3 rounded-xl border border-sidebar-border bg-secondary/55 px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
              {societyLogo ? (
                <img src={societyLogo} alt="" className="h-full w-full rounded-lg object-cover" />
              ) : (
                <Landmark size={16} />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-sidebar-foreground">{societyName}</p>
              <p className="truncate text-xs text-muted-foreground">Verified neighborhood space</p>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-3 flex h-9 w-9 items-center justify-center rounded-lg border border-sidebar-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200',
              activeItem === item.name
                ? 'border border-primary/20 bg-primary/10 text-primary shadow-none'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            {activeItem === item.name && (
              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <item.icon size={20} className={cn(
              'shrink-0 transition-colors',
              activeItem === item.name ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
            )} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {item.badge && (
                  <span className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black',
                    item.badge === 'New' 
                      ? 'bg-accent/15 text-accent'
                      : 'bg-secondary text-secondary-foreground'
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
                ? 'border border-primary/20 bg-primary/10 text-primary'
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
            'group mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive',
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
