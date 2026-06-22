
import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import {
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
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', icon: Home, href: '/', badge: null },
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

  const activeItem = navItems.find((i) => location === i.href || (i.href !== '/' && location.startsWith(i.href)))?.name ?? 'Dashboard'

  return (
    <aside
      className={cn(
        'relative flex h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out sticky top-0 self-start overflow-hidden',
        'hidden md:flex',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Decorative blob */}
      <div className="absolute -right-20 top-20 h-40 w-40 rounded-full bg-sidebar-primary/10 blur-3xl" />
      <div className="absolute -left-10 bottom-40 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-[#f9b233]/40 bg-[#0b4f49] px-4 text-white shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-white/70">
            <img src="/brand/mohalla-mark.svg" alt="" className="h-full w-full rounded-[10px]" />
          </span>
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-white">Mohalla</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/12 text-white/85 transition-colors hover:bg-white/20 hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className={cn('mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50', collapsed && 'sr-only')}>
          Main Menu
        </div>
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              activeItem === item.name
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            {activeItem === item.name && (
              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
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
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    item.badge === 'New' 
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'bg-sidebar-accent text-sidebar-accent-foreground'
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
      <div className="border-t border-sidebar-border p-3">
        {bottomItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              activeItem === item.name
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
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
      <div className="border-t border-sidebar-border p-3">
        <div className={cn(
          'flex items-center gap-3 rounded-xl bg-sidebar-accent/30 p-3',
          collapsed && 'justify-center'
        )}>
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sidebar-primary to-accent" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-green-500" />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold">Ahmed Khan</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Community Leader</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
