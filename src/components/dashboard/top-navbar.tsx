
import { useEffect, useState } from 'react'
import { Building2, Search, Sun, Moon, Plus, LogOut, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation, Link } from 'wouter'
import { NotificationBell } from './notification-bell'
import { useCurrentUser, useLogout } from '@/hooks/use-current-user'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back to your community' },
  '/': { title: 'Dashboard', subtitle: 'Welcome back to your community' },
  '/feed': { title: 'Community Feed', subtitle: 'Stay connected with your neighbors' },
  '/events': { title: 'Events', subtitle: 'Upcoming community events' },
  '/polls': { title: 'Polls', subtitle: 'Vote and share your opinion' },
  '/community': { title: 'Community', subtitle: 'Your mohalla members' },
  '/announcements': { title: 'Announcements', subtitle: 'Important updates' },
  '/marketplace': { title: 'Marketplace', subtitle: 'Buy, sell and give away within the community' },
  '/safety': { title: 'Safety & Alerts', subtitle: 'Community safety reports and alerts' },
  '/settings': { title: 'Settings', subtitle: 'Manage your preferences and account' },
  '/admin': { title: 'Admin Panel', subtitle: 'Manage your community' },
  '/admin/members': { title: 'Admin Panel', subtitle: 'Manage your community' },
  '/admin/posts': { title: 'Admin Panel', subtitle: 'Manage your community' },
  '/admin/community': { title: 'Admin Panel', subtitle: 'Manage your community' },
  '/admin/announcements': { title: 'Admin Panel', subtitle: 'Manage your community' },
  '/admin/contacts': { title: 'Admin Panel', subtitle: 'Manage emergency contacts and services' },
  '/places': { title: 'Places', subtitle: 'Nearby places of interest' },
  '/volunteer': { title: 'Volunteer', subtitle: 'Give back to the community' },
}

function matchPageMeta(location: string) {
  if (PAGE_META[location]) return PAGE_META[location]
  if (location.startsWith('/marketplace/')) return { title: 'Listing Detail', subtitle: 'Buy & Sell Marketplace' }
  if (location.startsWith('/profile/')) return { title: 'Profile', subtitle: 'Community member' }
  return { title: 'Mohalla', subtitle: 'Community Hub' }
}

export function TopNavbar() {
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )
  const [location, navigate] = useLocation()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const meta = matchPageMeta(location)
  const profileHref = `/profile/${user?.userId ?? 'me'}`
  const logoUrl = user?.community?.logoUrl

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('mohalla-theme')
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark
    document.documentElement.classList.toggle('dark', shouldUseDark)
    setDarkMode(shouldUseDark)
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    document.documentElement.classList.toggle('dark', next)
    window.localStorage.setItem('mohalla-theme', next ? 'dark' : 'light')
    setDarkMode(next)
  }

  const openComposer = () => {
    if (location.startsWith('/feed')) {
      window.dispatchEvent(new CustomEvent('mohalla:create-post'))
      return
    }
    navigate('/feed?compose=1')
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 lg:px-8">
      <div className="portal-panel flex h-[72px] items-center gap-3 rounded-[1.6rem] px-4 text-foreground shadow-[0_18px_48px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-6">
      {/* Left Section - Page Title */}
      <div className="flex min-w-0 flex-[0.95] items-center gap-3">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background/80 text-[var(--community-primary)] ring-1 ring-border/70 sm:flex">
          {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Building2 size={20} />}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="portal-chip mb-1 hidden w-fit text-[var(--community-primary)] xl:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Portal
          </div>
          <h1 className="portal-section-title truncate text-lg text-foreground sm:text-[1.35rem]">{meta.title}</h1>
          <p className="hidden truncate text-sm text-muted-foreground sm:block">{meta.subtitle}</p>
        </div>
      </div>

      {/* Center Section - Search (click opens Cmd+K palette) */}
      <div className="hidden min-w-0 flex-[1.25] justify-center px-2 lg:flex">
        <button
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            document.dispatchEvent(e)
          }}
          className="relative flex h-11 w-full max-w-xl items-center gap-2 rounded-2xl border portal-soft-rule bg-background/80 pl-10 pr-3 text-left text-sm text-foreground transition-colors hover:bg-background"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">Search neighbors, events, notices, listings...</span>
          <kbd className="pointer-events-none ml-auto shrink-0 rounded-lg border portal-soft-rule bg-muted/60 px-1.5 py-0.5 text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Section - Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            document.dispatchEvent(e)
          }}
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border portal-soft-rule bg-background/75 text-foreground transition-colors hover:bg-background lg:hidden"
        >
          <Search size={20} />
        </button>

        {/* Quick Action */}
        <Button
          onClick={openComposer}
          className="hidden h-11 gap-2 rounded-2xl bg-[var(--community-primary)] px-5 text-[var(--community-primary-foreground)] shadow-lg shadow-black/10 hover:opacity-90 sm:flex"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Button>

        {/* Live Notification Bell */}
        <NotificationBell />

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border portal-soft-rule bg-background/75 text-foreground transition-colors hover:bg-background"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Menu → profile link */}
        <Link href={profileHref} className="block">
          <button aria-label="Open profile" className="flex h-10 items-center gap-2 rounded-2xl border portal-soft-rule bg-background/75 p-1 transition-colors hover:bg-background sm:h-11 sm:py-1.5 sm:pl-1.5 sm:pr-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--community-primary)] text-sm font-bold text-[var(--community-primary-foreground)]">
                {(user?.name ?? 'R').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="max-w-28 truncate text-sm font-semibold text-foreground">{user?.name ?? 'Resident'}</p>
              <p className="max-w-28 truncate text-xs text-muted-foreground">{user?.community?.name ?? 'Community'}</p>
            </div>
          </button>
        </Link>
        <button
          type="button"
          onClick={logout}
          aria-label="Logout"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border portal-soft-rule bg-background/75 text-foreground transition-colors hover:bg-background"
        >
          <LogOut size={18} />
        </button>
      </div>
      </div>
    </header>
  )
}
