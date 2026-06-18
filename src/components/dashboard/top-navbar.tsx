
import { useState } from 'react'
import { Search, Sun, Moon, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation, Link } from 'wouter'
import { NotificationBell } from './notification-bell'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
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
  const [darkMode, setDarkMode] = useState(false)
  const [location] = useLocation()
  const meta = matchPageMeta(location)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-3 backdrop-blur-md sm:px-6">
      {/* Left Section - Page Title */}
      <div className="flex min-w-0 flex-col">
        <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">{meta.title}</h1>
        <p className="hidden truncate text-sm text-muted-foreground sm:block">{meta.subtitle}</p>
      </div>

      {/* Center Section - Search (click opens Cmd+K palette) */}
      <div className="hidden flex-1 justify-center px-8 md:flex">
        <button
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            document.dispatchEvent(e)
          }}
          className="relative w-full max-w-md flex items-center gap-2 h-10 rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          Search community, events, people...
          <kbd className="pointer-events-none ml-auto rounded-md border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
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
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Search size={20} />
        </button>

        {/* Quick Action */}
        <Button
          className="hidden gap-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 sm:flex"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Button>

        {/* Live Notification Bell */}
        <NotificationBell />

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Menu → profile link */}
        <Link href="/profile/ahmed" className="hidden sm:block">
          <button className="flex items-center gap-2 rounded-xl bg-muted/50 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-foreground">Ahmed K.</p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </Link>
      </div>
    </header>
  )
}
