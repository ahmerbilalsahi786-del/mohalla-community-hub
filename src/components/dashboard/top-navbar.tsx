
import { useEffect, useState } from 'react'
import { Search, Sun, Moon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'
import { NotificationBell } from './notification-bell'
import { useCurrentUser } from '@/hooks/use-current-user'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your mohalla, organized for today' },
  '/': { title: 'Dashboard', subtitle: 'Your mohalla, organized for today' },
  '/feed': { title: 'Community Feed', subtitle: 'Posts, notices, and neighbor conversations' },
  '/messages': { title: 'Messages', subtitle: 'Private community conversations' },
  '/city-feed': { title: 'City Feed', subtitle: 'Public updates across your city' },
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
  if (location.startsWith('/messages/')) return { title: 'Messages', subtitle: 'Private community conversations' }
  if (location.startsWith('/profile/')) return { title: 'Profile', subtitle: 'Community member' }
  return { title: 'Mohalla', subtitle: 'Community Hub' }
}

export function TopNavbar() {
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )
  const [location, navigate] = useLocation()
  const { data: user } = useCurrentUser()
  const meta = matchPageMeta(location)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('mohalla-theme')
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark
    document.documentElement.classList.toggle('dark', shouldUseDark)
    setDarkMode(shouldUseDark)
  }, [])

  useEffect(() => {
    const community = user?.community as any
    if (!community) return
    const root = document.documentElement
    const primary = community.themePrimaryColor
    const secondary = community.themeSecondaryColor
    const background = community.themeBackgroundColor
    const banner = community.themeBannerColor
    const sidebar = community.themeSidebarColor

    if (primary) {
      root.style.setProperty('--primary', primary)
      root.style.setProperty('--primary-hover', `color-mix(in oklch, ${primary} 86%, black)`)
      root.style.setProperty('--ring', primary)
      root.style.setProperty('--sidebar-primary', primary)
    }
    if (secondary) root.style.setProperty('--accent', secondary)
    if (background) root.style.setProperty('--background', background)
    if (banner) {
      root.style.setProperty('--card', banner)
      root.style.setProperty('--popover', banner)
    }
    if (sidebar) root.style.setProperty('--sidebar', sidebar)
  }, [user?.community])

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
    <header className="sticky top-0 z-40 border-b portal-soft-rule bg-background/90 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-7">
      <div className="mx-auto flex min-h-16 w-full max-w-[1360px] items-center gap-3 text-foreground">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <h1 className="portal-section-title truncate text-lg leading-tight text-foreground sm:text-xl">{meta.title}</h1>
          <p className="hidden truncate text-sm text-muted-foreground sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="hidden min-w-0 flex-[1.1] justify-center px-2 lg:flex">
        <button
          type="button"
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
            document.dispatchEvent(e)
          }}
          aria-label="Open search"
          className="relative flex h-11 w-full max-w-xl items-center gap-2 rounded-xl border portal-soft-rule bg-card pl-10 pr-3 text-left text-sm text-foreground shadow-xs transition-colors hover:border-primary/30 hover:bg-secondary/50"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">Search neighbors, events, notices, listings...</span>
          <kbd className="pointer-events-none ml-auto shrink-0 rounded-md border portal-soft-rule bg-muted/70 px-1.5 py-0.5 text-xs text-muted-foreground">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
            document.dispatchEvent(e)
          }}
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-lg border portal-soft-rule bg-card text-foreground transition-colors hover:bg-secondary lg:hidden"
        >
          <Search size={20} />
        </button>

        <Button
          onClick={openComposer}
          className="hidden h-11 gap-2 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-primary-hover sm:flex"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Button>

        <NotificationBell />

        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Use light mode' : 'Use dark mode'}
          className="flex h-10 w-10 items-center justify-center rounded-lg border portal-soft-rule bg-card text-foreground transition-colors hover:bg-secondary"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      </div>
    </header>
  )
}
