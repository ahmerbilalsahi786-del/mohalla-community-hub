import { ArrowRight, CalendarPlus, Megaphone, PackagePlus, Search, ShieldAlert, Users } from 'lucide-react'
import { Link } from 'wouter'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

type EmptyKind = 'feed' | 'marketplace' | 'events' | 'members' | 'notifications' | 'safety' | 'search' | 'generic'

const KIND_META: Record<EmptyKind, { icon: React.ElementType; title: string; description: string; action?: string; href?: string }> = {
  feed: {
    icon: Megaphone,
    title: 'No community posts yet',
    description: 'Start the first update, request, or announcement so neighbors know what is happening.',
    action: 'Share first update',
    href: '/feed?compose=1',
  },
  marketplace: {
    icon: PackagePlus,
    title: 'Nothing in the marketplace yet',
    description: 'List a useful item or service and keep value circulating inside your mohalla.',
    action: 'Add listing',
    href: '/marketplace?create=1',
  },
  events: {
    icon: CalendarPlus,
    title: 'No events on the calendar',
    description: 'Plan a cleanup, meetup, or residents meeting and invite your community.',
    action: 'Create event',
    href: '/events?create=1',
  },
  members: {
    icon: Users,
    title: 'No residents here yet',
    description: 'Verified residents will appear here once they join this community.',
  },
  notifications: {
    icon: Megaphone,
    title: 'All caught up',
    description: 'Approvals, comments, complaints, new residents, and events will appear here.',
  },
  safety: {
    icon: ShieldAlert,
    title: 'No active safety alerts',
    description: 'Your mohalla is calm right now. Report anything urgent so residents can respond quickly.',
    action: 'Report alert',
    href: '/safety?create=1',
  },
  search: {
    icon: Search,
    title: 'No matching results',
    description: 'Try a neighbor name, event title, listing, place, post, or complaint keyword.',
  },
  generic: {
    icon: Megaphone,
    title: 'Nothing here yet',
    description: 'New community activity will appear here as residents participate.',
  },
}

export function CommunityEmptyState({
  kind = 'generic',
  title,
  description,
  action,
  href,
  onAction,
  compact,
  className,
}: {
  kind?: EmptyKind
  title?: string
  description?: string
  action?: string
  href?: string
  onAction?: () => void
  compact?: boolean
  className?: string
}) {
  const meta = KIND_META[kind]
  const Icon = meta.icon
  const actionLabel = action ?? meta.action
  const actionHref = href ?? meta.href

  return (
    <Empty className={cn('border border-dashed border-border bg-card/70 shadow-sm', compact && 'py-8', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="rounded-xl bg-primary/10 text-primary">
          <Icon />
        </EmptyMedia>
        <EmptyTitle className="font-bold text-foreground">{title ?? meta.title}</EmptyTitle>
        <EmptyDescription>{description ?? meta.description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && (actionHref || onAction) && (
        <EmptyContent>
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={actionHref!}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </EmptyContent>
      )}
    </Empty>
  )
}
