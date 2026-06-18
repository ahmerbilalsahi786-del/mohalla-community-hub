import { useState, useRef } from 'react'
import {
  useListAlerts, useCreateAlert, useResolveAlert,
  useListAlertComments, useCreateAlertComment,
  getListAlertsQueryKey, getListAlertCommentsQueryKey
} from '@/lib/generated/api'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import {
  AlertTriangle, Flame, Zap, Droplets, ShieldAlert, HelpCircle,
  MapPin, ChevronDown, ChevronUp, CheckCircle2, Plus, X, Send,
  MessageSquare, Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AlertType = 'theft' | 'suspicious' | 'emergency' | 'power_outage' | 'water_shortage' | 'other'
type Severity = 'low' | 'medium' | 'high'

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  theft:          { label: 'Theft',          icon: ShieldAlert,  color: 'text-red-500' },
  suspicious:     { label: 'Suspicious',     icon: AlertTriangle, color: 'text-amber-500' },
  emergency:      { label: 'Emergency',      icon: Flame,        color: 'text-red-600' },
  power_outage:   { label: 'Power Outage',   icon: Zap,          color: 'text-amber-400' },
  water_shortage: { label: 'Water Shortage', icon: Droplets,     color: 'text-blue-500' },
  other:          { label: 'Other',          icon: HelpCircle,   color: 'text-muted-foreground' },
}

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  high:   { label: 'High',   bg: 'bg-red-500/10',   text: 'text-red-600',   ring: 'border-red-300' },
  medium: { label: 'Medium', bg: 'bg-amber-500/10', text: 'text-amber-700', ring: 'border-amber-300' },
  low:    { label: 'Low',    bg: 'bg-green-500/10', text: 'text-green-700', ring: 'border-green-300' },
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function buildWhatsAppShareUrl(alert: { title: string; userName: string; locationDetail: string }) {
  const text = encodeURIComponent(
    `🚨 Safety Alert in Mohalla Community:\n"${alert.title}" reported by ${alert.userName}${alert.locationDetail ? ` at ${alert.locationDetail}` : ''}.\nOpen Mohalla app for details.`
  )
  return `https://wa.me/?text=${text}`
}

interface AlertData {
  id: number
  userId: string
  userName: string
  unitNumber: string
  type: string
  title: string
  description: string
  locationDetail: string
  imageUrl?: string | null
  severity: string
  isResolved: boolean
  createdAt: string
}

function AlertComments({ alertId }: { alertId: number }) {
  const [body, setBody] = useState('')
  const { data: comments = [], isLoading } = useListAlertComments(alertId)
  const queryClient = useQueryClient()
  const createComment = useCreateAlertComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertCommentsQueryKey(alertId) })
        setBody('')
      },
    },
  })

  return (
    <div className="mt-4 border-t border-border pt-4 space-y-3">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading updates...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No updates yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 text-xs font-bold text-white">
                {c.userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="rounded-xl bg-muted/50 px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-foreground">{c.userName}</span>
                    <span className="text-xs text-muted-foreground">{c.unitNumber}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{c.body}</p>
                </div>
                <p className="mt-1 px-1 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 text-xs font-bold text-white">AK</div>
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            placeholder="Add an update..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && body.trim() && createComment.mutate({ alertId, data: { body: body.trim() } })}
            className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => body.trim() && createComment.mutate({ alertId, data: { body: body.trim() } })}
            disabled={!body.trim() || createComment.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertCard({ alert, onResolve }: { alert: AlertData; onResolve: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const typeCfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.other
  const sevCfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium
  const TypeIcon = typeCfg.icon
  const isCurrentUser = alert.userId === 'ahmed'

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all',
      alert.isResolved ? 'border-border opacity-60' : sevCfg.ring,
      !alert.isResolved && alert.severity === 'high' && 'shadow-red-100'
    )}>
      {/* Severity stripe */}
      {!alert.isResolved && (
        <div className={cn(
          'h-1 w-full',
          alert.severity === 'high' ? 'bg-red-500' :
          alert.severity === 'medium' ? 'bg-amber-400' : 'bg-green-500'
        )} />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            alert.isResolved ? 'bg-muted' : sevCfg.bg
          )}>
            <TypeIcon size={20} className={alert.isResolved ? 'text-muted-foreground' : typeCfg.color} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    sevCfg.bg, sevCfg.text
                  )}>
                    {sevCfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{typeCfg.label}</span>
                  {alert.isResolved && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-700">
                      <CheckCircle2 size={10} />
                      Resolved
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-semibold text-foreground">{alert.title}</h3>
              </div>
            </div>

            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{alert.description}</p>

            {alert.locationDetail && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={11} />
                <span>{alert.locationDetail}</span>
              </div>
            )}

            {alert.imageUrl && (
              <img
                src={alert.imageUrl}
                alt=""
                className="mt-3 h-48 w-full rounded-xl object-cover border border-border"
              />
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{alert.userName}</span>
                <span> · {alert.unitNumber} · {timeAgo(alert.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Share to WhatsApp */}
                <a
                  href={buildWhatsAppShareUrl(alert)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share to WhatsApp"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors"
                >
                  <Share2 size={14} />
                </a>

                {/* Mark Resolved */}
                {!alert.isResolved && isCurrentUser && (
                  <button
                    onClick={() => onResolve(alert.id)}
                    className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-500/20 transition-colors"
                  >
                    <CheckCircle2 size={12} />
                    Resolve
                  </button>
                )}

                {/* Toggle comments */}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  <MessageSquare size={13} />
                  Updates
                  {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              </div>
            </div>

            {expanded && <AlertComments alertId={alert.id} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportAlertModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<AlertType>('suspicious')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const queryClient = useQueryClient()

  const createAlert = useCreateAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() })
        onClose()
      },
    },
  })

  const typeOptions: { value: AlertType; label: string }[] = [
    { value: 'theft', label: 'Theft' },
    { value: 'suspicious', label: 'Suspicious Activity' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'power_outage', label: 'Power Outage' },
    { value: 'water_shortage', label: 'Water Shortage' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Report Safety Alert</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Severity */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as Severity[]).map((s) => {
                const cfg = SEVERITY_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={cn(
                      'rounded-xl py-2 text-sm font-semibold border transition-all',
                      severity === s ? `${cfg.bg} ${cfg.text} ${cfg.ring}` : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'rounded-xl py-2 text-xs font-medium border transition-all',
                    type === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
            <input
              type="text"
              placeholder="Brief summary of the alert"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
            <textarea
              placeholder="What happened? Provide as much detail as possible..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Location (optional)</label>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="e.g. Near Gate 2, Building B parking"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() => createAlert.mutate({ data: { type, title: title.trim(), description: description.trim(), locationDetail: location.trim(), severity } })}
            disabled={!title.trim() || !description.trim() || createAlert.isPending}
            className={cn(
              'rounded-xl text-white',
              severity === 'high' ? 'bg-red-600 hover:bg-red-700' :
              severity === 'medium' ? 'bg-amber-500 hover:bg-amber-600' :
              'bg-green-600 hover:bg-green-700'
            )}
          >
            {createAlert.isPending ? 'Reporting...' : 'Report Alert'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Safety() {
  const [showReport, setShowReport] = useState(false)
  const { data: allAlerts = [], isLoading } = useListAlerts({ communityId: 'default' })
  const queryClient = useQueryClient()

  const resolveAlert = useResolveAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() }),
    },
  })

  const activeAlerts = (allAlerts as AlertData[]).filter((a) => !a.isResolved)
  const resolvedAlerts = (allAlerts as AlertData[]).filter((a) => a.isResolved)

  return (
    <div className="flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-red-500/3 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto p-3 pb-24 sm:p-6">

          {/* Header row */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Safety & Alerts</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={() => setShowReport(true)}
              className="w-full gap-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700 sm:w-auto"
            >
              <Plus size={16} />
              Report Alert
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active alerts */}
              {activeAlerts.length > 0 ? (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onResolve={(id) => resolveAlert.mutate({ alertId: id })}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 mb-3">
                    <CheckCircle2 size={28} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">No active alerts.</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your community is safe 🟢</p>
                </div>
              )}

              {/* Resolved alerts */}
              {resolvedAlerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Resolved ({resolvedAlerts.length})
                  </h3>
                  <div className="space-y-3">
                    {resolvedAlerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onResolve={(id) => resolveAlert.mutate({ alertId: id })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowReport(true)}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105 hover:bg-red-700 md:bottom-8 md:right-8"
      >
        <Plus size={24} />
      </button>

      {showReport && <ReportAlertModal onClose={() => setShowReport(false)} />}
    </div>
  )
}
