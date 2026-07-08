import { useState, useRef, useEffect } from 'react'
import { Bell, CalendarDays, CheckCheck, ClipboardList, Heart, Megaphone, MessageSquare, ShieldAlert, ShoppingBag, UserCheck, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommunityEmptyState } from '@/components/community/community-empty-state'
import { TimelineRow } from '@/components/community/timeline-row'

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
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifs(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch {}
    finally { setLoading(false) }
  }

  // Poll every 30 s
  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30000)
    return () => clearInterval(id)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border portal-soft-rule bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground ring-2 ring-background">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close notifications"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="notification-drawer absolute bottom-0 right-0 top-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl sm:w-[420px]">
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              <span className="text-base font-black text-foreground">Notifications</span>
              <p className="mt-0.5 text-sm text-muted-foreground">Approvals, comments, complaints, residents, and events</p>
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-border">
            {loading && notifs.length === 0 ? (
              <div className="space-y-3 p-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
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
                onClick={() => { window.location.href = '/notifications'; setOpen(false) }}
                className="w-full text-center text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                View all notifications
              </button>
            </div>
          )}
          </aside>
        </div>
      )}
    </div>
  )
}
