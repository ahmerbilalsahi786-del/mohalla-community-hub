import { useCallback, useEffect, useState } from 'react'
import { Bell, CalendarDays, CheckCheck, ClipboardList, Heart, Megaphone, MessageSquare, ShieldAlert, ShoppingBag, UserCheck, UserPlus } from 'lucide-react'
import { CommunityEmptyState } from '@/components/community/community-empty-state'
import { TimelineRow } from '@/components/community/timeline-row'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

type Notif = {
  id: string; type: string; title: string; body: string; link: string;
  isRead: boolean; createdAt: string;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; tone: string; label: string }> = {
  approval:     { icon: UserCheck,     tone: 'bg-primary/10 text-primary', label: 'Approval' },
  approved:     { icon: UserCheck,     tone: 'bg-primary/10 text-primary', label: 'Approval' },
  comment:      { icon: MessageSquare, tone: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', label: 'Comment' },
  complaint:    { icon: ClipboardList, tone: 'bg-red-600/10 text-red-700 dark:text-red-300', label: 'Complaint' },
  event:        { icon: CalendarDays,  tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Event' },
  resident:     { icon: UserPlus,      tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', label: 'New resident' },
  like:         { icon: Heart,         tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300', label: 'Like' },
  safety:       { icon: ShieldAlert,   tone: 'bg-red-500/10 text-red-700 dark:text-red-300', label: 'Safety' },
  safety_alert: { icon: ShieldAlert,   tone: 'bg-red-500/10 text-red-700 dark:text-red-300', label: 'Safety' },
  announcement: { icon: Megaphone,     tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Announcement' },
  marketplace:  { icon: ShoppingBag,   tone: 'bg-green-500/10 text-green-700 dark:text-green-300', label: 'Marketplace' },
  message:      { icon: MessageSquare, tone: 'bg-primary/10 text-primary', label: 'Message' },
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function NotificationBell() {
  const [open, setOpen]         = useState(false)
  const [notifs, setNotifs]     = useState<Notif[]>([])
  const [unread, setUnread]     = useState(0)
  const [loading, setLoading]   = useState(false)
  const [loadError, setLoadError] = useState(false)

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(false)
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Could not load notifications')
      const data = await res.json()
      setNotifs(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch {
      setLoadError(true)
    }
    finally { setLoading(false) }
  }, [])

  // Poll every 30 s
  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    setNotifs(n => n.map(x => ({ ...x, isRead: true })))
    setUnread(0)
  }

  const markOneRead = async (id: string, link: string) => {
    setNotifs(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
    setUnread(u => Math.max(0, u - 1))
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    if (link) window.location.href = link
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) void fetchNotifs()
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border portal-soft-rule bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground ring-2 ring-background">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full max-w-md gap-0 border-l border-border bg-card p-0 sm:max-w-[420px]">
        <SheetHeader className="border-b border-border px-5 py-4 pr-14 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-base font-black">Notifications</SheetTitle>
              <SheetDescription className="mt-0.5">
                Approvals, comments, complaints, residents, and events
              </SheetDescription>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {loading && notifs.length === 0 ? (
            <div className="space-y-3 p-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError && notifs.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <Bell className="h-9 w-9 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-black text-foreground">Could not load notifications</p>
              <p className="mt-1 text-sm text-muted-foreground">Please check your connection and try again.</p>
              <button
                type="button"
                onClick={() => void fetchNotifs()}
                className="mt-4 min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover"
              >
                Try again
              </button>
            </div>
          ) : notifs.length === 0 ? (
            <CommunityEmptyState kind="notifications" className="m-5 min-h-[360px]" />
          ) : (
            notifs.map((n) => {
              const cfg = TYPE_ICON[n.type] ?? TYPE_ICON.announcement
              return (
                <TimelineRow
                  key={n.id}
                  icon={cfg.icon}
                  title={n.title}
                  description={n.body}
                  meta={`${cfg.label} · ${timeAgo(n.createdAt)}`}
                  tone={cfg.tone}
                  unread={!n.isRead}
                  onClick={() => markOneRead(n.id, n.link)}
                />
              )
            })
          )}
        </div>

        {notifs.length > 0 && (
          <div className="border-t border-border px-4 py-2.5">
            <button
              type="button"
              onClick={() => { window.location.href = '/notifications'; setOpen(false) }}
              className="w-full min-h-10 text-center text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              View all notifications
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
