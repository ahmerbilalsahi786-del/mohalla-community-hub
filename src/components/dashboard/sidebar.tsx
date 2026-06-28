
import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import {
  Building2,
  Home,
  Users,
  Calendar,
  MessageSquare,
  Bell,
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
} from 'lucide-react'
import { InstallAppButton } from '@/components/pwa/install-app'
import { canManageCommunity, useCurrentUser, useLogout } from '@/hooks/use-current-user'

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/dashboard', badge: null },
  { name: 'Community Feed', icon: MessageSquare, href: '/feed', badge: null },
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

const bottomItems = [
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
  const communityName = user?.community?.name ?? 'Mohalla'
  const visibleNavItems = navItems.filter((item) => item.href !== '/admin' || canManageCommunity(user?.role))

  const activeItem =
    [...visibleNavItems, ...bottomItems].find((i) => location === i.href || location.startsWith(`${i.href}/`))?.name ??
    'Dashboard'

  return (
    <aside
      className={cn(
        'portal-panel sticky top-0 relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-border/60 bg-[color-mix(in_oklch,var(--community-sidebar)_88%,var(--background)_12%)] text-[var(--community-sidebar-foreground)] transition-all duration-300 ease-in-out self-start',
        'hidden md:flex',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background/10 to-transparent" />
      <div className="absolute inset-x-4 top-24 h-px bg-border/20" />

      {/* Logo Section */}
      <div className="flex h-20 items-center justify-between border-b border-border/10 bg-[color-mix(in_oklch,var(--community-banner)_88%,var(--background)_12%)] px-4 text-[var(--community-banner-foreground)] shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background/80 p-0.5 text-[var(--community-primary)] shadow-sm ring-1 ring-border/70">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-full w-full rounded-[10px] object-cover" />
            ) : (
              <Building2 size={22} />
            )}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <span className="brand-wordmark block truncate text-lg tracking-tight">{communityName}</span>
              <span className="text-xs text-[var(--community-banner-foreground)]/70">Neighborhood Portal</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/8 transition-colors hover:bg-black/14"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-4">
        <div className={cn('mb-3 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-sidebar-foreground/45', collapsed && 'sr-only')}>
          Main Menu
        </div>
        {visibleNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
              activeItem === item.name
                ? 'bg-background/14 text-sidebar-accent-foreground shadow-lg shadow-black/10'
                : 'text-sidebar-foreground/72 hover:bg-background/8 hover:text-sidebar-foreground'
            )}
          >
            {activeItem === item.name && (
              <div className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
            )}
            <item.icon size={20} className={cn(
              'shrink-0 transition-colors',
              activeItem === item.name ? 'text-sidebar-primary' : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
            )} />
            {!collapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-black',
                    item.badge === 'New' 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'bg-background/12 text-sidebar-accent-foreground'
                  )}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-border/10 p-3">
        <InstallAppButton collapsed={collapsed} className="mb-1" />
        {bottomItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
              activeItem === item.name
                ? 'bg-background/14 text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/72 hover:bg-background/8 hover:text-sidebar-foreground'
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
      </div>

      {/* User Profile */}
      <div className="border-t border-border/10 p-3">
        <Link
          href={profileHref}
          className={cn(
            'flex items-center gap-3 rounded-2xl bg-background/10 p-3 transition-colors hover:bg-background/14',
            collapsed && 'justify-center'
          )}
        >
          <div className="relative shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-accent text-sm font-bold text-white shadow-md shadow-black/10">
                {(user?.name ?? 'R').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-green-500" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold">{user?.name ?? 'Resident'}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {user?.unitNumber ? `${user.unitNumber} · ` : ''}{canManageCommunity(user?.role) ? 'Admin' : 'Member'}
              </p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={logout}
          className={cn(
            'mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-sidebar-foreground/72 transition-colors hover:bg-background/8 hover:text-sidebar-foreground',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
