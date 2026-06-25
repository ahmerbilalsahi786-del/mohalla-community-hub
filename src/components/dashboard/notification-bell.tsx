import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, MessageSquare, Heart, ShieldAlert, Megaphone, ShoppingBag, UserCheck, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Notif = {
  id: number; type: string; title: string; body: string; link: string;
  isRead: boolean; createdAt: string;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  comment:      { icon: MessageSquare, color: 'text-blue-500' },
  like:         { icon: Heart,         color: 'text-rose-500' },
  safety:       { icon: ShieldAlert,   color: 'text-red-500' },
  announcement: { icon: Megaphone,     color: 'text-amber-500' },
  marketplace:  { icon: ShoppingBag,   color: 'text-green-600' },
  approved:     { icon: UserCheck,     color: 'text-primary' },
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

  const markOneRead = async (id: number, link: string) => {
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
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-foreground text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
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
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell size={28} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">No notifications yet</p>
              </div>
            ) : (
              notifs.map((n) => {
                const cfg = TYPE_ICON[n.type] ?? TYPE_ICON.announcement
                const Icon = cfg.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => markOneRead(n.id, n.link)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                      !n.isRead && 'bg-primary/5'
                    )}
                  >
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60 mt-0.5', cfg.color)}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm leading-snug truncate', n.isRead ? 'text-muted-foreground' : 'font-semibold text-foreground')}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={() => { window.location.href = '/notifications'; setOpen(false) }}
                className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
