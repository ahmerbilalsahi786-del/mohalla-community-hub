import { useState } from 'react'
import {
  useListEvents, useCreateEvent, useRsvpEvent,
  getListEventsQueryKey,
} from '@/lib/generated/api'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import {
  Calendar, Clock, MapPin, Users, Plus, X, ChevronDown,
  CheckCircle2, HelpCircle, XCircle, ImagePlus, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { uploadImage } from '@/lib/cloudinary'
import LocationPicker, { type PickedLocation } from '@/components/location-picker'
import { PublicationToggle } from '@/components/city-feed/publication-toggle'
import { CommunityEmptyState } from '@/components/community/community-empty-state'
import { EventSkeleton } from '@/components/community/skeleton-states'

type EventItem = {
  id: number; title: string; description: string; date: string; time: string;
  location: string; imageUrl?: string | null; rsvpCount: number; createdAt: string;
  userName: string; unitNumber: string; userId: string;
  myStatus?: string | null;
  latitude?: number | null; longitude?: number | null;
}

const RSVP_OPTIONS = [
  { status: 'going',     label: 'Going',     icon: CheckCircle2, active: 'bg-green-500 text-white', inactive: 'bg-green-500/10 text-green-700 hover:bg-green-500/20' },
  { status: 'maybe',     label: 'Maybe',     icon: HelpCircle,   active: 'bg-amber-400 text-white', inactive: 'bg-amber-400/10 text-amber-700 hover:bg-amber-400/20' },
  { status: 'not_going', label: "Can't Go",  icon: XCircle,      active: 'bg-muted-foreground text-white', inactive: 'bg-muted text-muted-foreground hover:bg-muted/80' },
]

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
function isUpcomingSoon(date: string) {
  const diff = (new Date(date + 'T00:00:00').getTime() - Date.now()) / 86400000
  return diff >= 0 && diff <= 3
}

function EventCard({ event, isPast }: { event: EventItem; isPast?: boolean }) {
  const qc = useQueryClient()
  const rsvp = useRsvpEvent({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEventsQueryKey() })
      },
    },
  })

  const soon = isUpcomingSoon(event.date)

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md',
      isPast ? 'border-border opacity-70' : soon ? 'border-primary/30' : 'border-border'
    )}>
      {event.imageUrl && (
        <img src={event.imageUrl} alt={event.title} className="h-40 w-full object-cover" />
      )}
      {!event.imageUrl && !isPast && (
        <div className={cn('h-2 w-full', soon ? 'bg-primary' : 'bg-accent/60')} />
      )}

      <div className="p-4">
        {soon && !isPast && (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            🔥 Coming up soon
          </span>
        )}

        <h3 className="font-semibold text-foreground text-base leading-snug">{event.title}</h3>
        {event.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={13} className="shrink-0" />
            <span>{formatDate(event.date)}{event.time && ` · ${event.time}`}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={13} className="shrink-0" />
              {event.latitude != null && event.longitude != null ? (
                <a
                  href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-primary"
                >
                  {event.location}
                </a>
              ) : (
                <span>{event.location}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={13} className="shrink-0" />
            <span>{event.rsvpCount} attending</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">By {event.userName} · {event.unitNumber}</span>
          <PublicationToggle sourceType="event" sourceId={event.id} variant="chip" className="ml-auto mr-2" />
          {!isPast && (
            <div className="flex items-center gap-1">
              {RSVP_OPTIONS.map(opt => {
                const Icon = opt.icon
                const active = event.myStatus === opt.status
                return (
                  <button
                    key={opt.status}
                    onClick={() => rsvp.mutate({ eventId: event.id, data: { status: opt.status } })}
                    disabled={rsvp.isPending}
                    className={cn(
                      'flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all',
                      active ? opt.active : opt.inactive
                    )}
                  >
                    <Icon size={12} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
          {isPast && (
            <span className="text-xs text-muted-foreground italic">{event.rsvpCount} attended</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateEventModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [date, setDate]         = useState('')
  const [time, setTime]         = useState('')
  const [location, setLocation] = useState('')
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const create = useCreateEvent({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEventsQueryKey() })
        onClose()
      },
    },
  })

  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    try {
      const url = await uploadImage(f)
      if (url) {
        setImageUrl(url)
      } else {
        toast({
          title: 'Image upload failed',
          description: 'Please try again.',
          variant: 'destructive',
        })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Create Event</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Image */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Event Photo (optional)</label>
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} className="h-32 w-full rounded-xl object-cover" alt="" />
                <button onClick={() => setImageUrl(undefined)} className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className={cn('flex items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-muted/30 transition-colors text-sm text-muted-foreground', uploading && 'opacity-60 pointer-events-none')}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                {uploading ? 'Uploading…' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImg} disabled={uploading} />
              </label>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Event Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Rooftop BBQ this Saturday"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3}
              placeholder="Tell residents what to expect..."
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Location</label>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-muted-foreground shrink-0" />
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Rooftop, Building B"
                className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Map Tag (optional)</label>
            <LocationPicker
              compact
              onSelect={(data) => {
                setPickedLocation(data)
                if (!location.trim() && data.address) setLocation(data.address)
              }}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() => create.mutate({
              data: {
                title: title.trim(),
                description,
                date,
                time,
                location,
                latitude: pickedLocation?.latitude ?? null,
                longitude: pickedLocation?.longitude ?? null,
                imageUrl,
              },
            })}
            disabled={!title.trim() || !date || create.isPending}
            className="rounded-xl gap-2"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            Create Event
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Events() {
  const [showCreate, setShowCreate] = useState(false)
  const { data, isLoading } = useListEvents({ communityId: 'default' })

  const upcoming = (data as any)?.upcoming ?? []
  const past = (data as any)?.past ?? []

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Events</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{upcoming.length} upcoming</p>
              </div>
              <Button onClick={() => setShowCreate(true)} className="w-full gap-2 rounded-xl sm:w-auto">
                <Plus size={16} /> Create Event
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <EventSkeleton key={i} />)}
              </div>
            ) : (
              <div className="space-y-8">
                {upcoming.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {upcoming.map((e: EventItem) => <EventCard key={e.id} event={e} />)}
                    </div>
                  </div>
                ) : (
                  <CommunityEmptyState
                    kind="events"
                    action="Create Event"
                    onAction={() => setShowCreate(true)}
                  />
                )}

                {past.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Past Events</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {past.map((e: EventItem) => <EventCard key={e.id} event={e} isPast />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 md:bottom-8 md:right-8"
      >
        <Plus size={24} />
      </button>

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
