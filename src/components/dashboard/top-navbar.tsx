
import { useState } from 'react'
import { Search, Sun, Moon, Plus, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocation, Link } from 'wouter'
import { NotificationBell } from './notification-bell'
import { useCurrentUser, useLogout } from '@/hooks/use-current-user'

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
  const [location, navigate] = useLocation()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const meta = matchPageMeta(location)
  const profileHref = `/profile/${user?.userId ?? 'me'}`

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const openComposer = () => {
    if (location.startsWith('/feed')) {
      window.dispatchEvent(new CustomEvent('mohalla:create-post'))
      return
    }
    navigate('/feed?compose=1')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-[#f9b233]/40 bg-[#0b4f49] px-3 text-white shadow-sm backdrop-blur-md sm:px-6">
      {/* Left Section - Page Title */}
      <div className="flex min-w-0 flex-col">
        <h1 className="truncate text-lg font-bold text-white sm:text-xl">{meta.title}</h1>
        <p className="hidden truncate text-sm text-white/75 sm:block">{meta.subtitle}</p>
      </div>

      {/* Center Section - Search (click opens Cmd+K palette) */}
      <div className="hidden flex-1 justify-center px-8 md:flex">
        <button
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
            document.dispatchEvent(e)
          }}
          className="relative flex h-10 w-full max-w-md items-center gap-2 rounded-xl border border-white/25 bg-white/10 pl-10 pr-3 text-left text-sm text-white/80 transition-colors hover:bg-white/15"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
          <span className="min-w-0 flex-1 truncate">Search community, events, people...</span>
          <kbd className="pointer-events-none ml-auto shrink-0 rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-xs text-white/70">
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
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/15 hover:text-white md:hidden"
        >
          <Search size={20} />
        </button>

        {/* Quick Action */}
        <Button
          onClick={openComposer}
          className="hidden gap-2 rounded-xl bg-[#f9b233] text-[#103d39] shadow-md shadow-black/10 hover:bg-[#ffc24f] sm:flex"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Button>

        {/* Live Notification Bell */}
        <NotificationBell />

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Menu → profile link */}
        <Link href={profileHref} className="block">
          <button aria-label="Open profile" className="flex h-10 items-center gap-2 rounded-xl bg-white/10 p-1 transition-colors hover:bg-white/15 sm:py-1.5 sm:pl-1.5 sm:pr-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f9b233] text-sm font-bold text-[#103d39]">
                {(user?.name ?? 'R').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="max-w-28 truncate text-sm font-semibold text-white">{user?.name ?? 'Resident'}</p>
            </div>
          </button>
        </Link>
        <button
          type="button"
          onClick={logout}
          aria-label="Logout"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
