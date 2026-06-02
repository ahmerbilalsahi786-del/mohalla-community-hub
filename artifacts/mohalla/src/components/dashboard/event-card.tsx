import { Calendar, MapPin, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  attendees: number
  maxAttendees?: number
  category: string
  image?: string
}

interface EventCardProps {
  event: Event
  variant?: 'default' | 'compact'
}

const categoryColors: Record<string, string> = {
  'Community': 'bg-primary/10 text-primary',
  'Sports': 'bg-green-500/10 text-green-600',
  'Culture': 'bg-accent/10 text-accent',
  'Food': 'bg-amber-500/10 text-amber-600',
  'Education': 'bg-indigo-500/10 text-indigo-600',
}

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  if (variant === 'compact') {
    return (
      <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
        {/* Date Badge */}
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10">
          <span className="text-xs font-medium text-primary">
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-xl font-bold text-primary">
            {new Date(event.date).getDate()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="truncate font-semibold text-card-foreground">{event.title}</h4>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {event.attendees} going
            </span>
          </div>
        </div>

        {/* Category */}
        <span className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
          categoryColors[event.category] || 'bg-muted text-muted-foreground'
        )}>
          {event.category}
        </span>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      {/* Decorative Elements */}
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-accent/5 transition-transform duration-500 group-hover:scale-125" />

      {/* Image/Banner */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-8 h-6 w-6 rounded-full bg-primary/20" />
          <div className="absolute top-8 right-12 h-4 w-4 rounded-full bg-accent/20" />
          <div className="absolute bottom-6 left-1/3 h-3 w-3 rounded-full bg-primary/15" />
          <div className="absolute top-12 left-1/2 h-5 w-5 rounded-full bg-accent/15" />
        </div>
        
        {/* Category Badge */}
        <div className="absolute left-4 top-4">
          <span className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold',
            categoryColors[event.category] || 'bg-muted text-muted-foreground'
          )}>
            {event.category}
          </span>
        </div>

        {/* Date Badge */}
        <div className="absolute -bottom-6 right-4 flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-border bg-card shadow-md">
          <span className="text-xs font-medium text-primary">
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-2xl font-bold text-card-foreground">
            {new Date(event.date).getDate()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6 pt-8">
        <h3 className="text-lg font-bold text-card-foreground">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>

        {/* Meta Info */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-primary" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-accent" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-primary" />
            <span>
              {event.attendees}
              {event.maxAttendees && `/${event.maxAttendees}`} attending
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="mt-4 flex items-center justify-between">
          {/* Attendee Avatars */}
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full border-2 border-card bg-gradient-to-br from-primary/40 to-accent/40"
                style={{ zIndex: 4 - i }}
              />
            ))}
            {event.attendees > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium text-muted-foreground">
                +{event.attendees - 4}
              </div>
            )}
          </div>

          <Button 
            size="sm"
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Join Event
          </Button>
        </div>
      </div>
    </div>
  )
}
