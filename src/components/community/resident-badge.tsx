import { BadgeCheck, Crown, Shield, Star, UserRoundCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ResidentBadgeKind = 'verified' | 'admin' | 'moderator' | 'building_rep' | 'new_neighbor'

const BADGE_META: Record<ResidentBadgeKind, { label: string; icon: React.ElementType; className: string }> = {
  verified: {
    label: 'Verified Resident',
    icon: BadgeCheck,
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  admin: {
    label: 'Admin',
    icon: Crown,
    className: 'border-primary/25 bg-primary/10 text-primary',
  },
  moderator: {
    label: 'Moderator',
    icon: Shield,
    className: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  building_rep: {
    label: 'Building Rep',
    icon: Star,
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  new_neighbor: {
    label: 'New Neighbor',
    icon: UserRoundCheck,
    className: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  },
}

export function roleToBadgeKind(role?: string | null): ResidentBadgeKind | null {
  const normalized = role?.toLowerCase().replace(/[\s-]+/g, '_')
  if (normalized === 'admin' || normalized === 'community_admin') return 'admin'
  if (normalized === 'moderator') return 'moderator'
  if (normalized === 'building_rep' || normalized === 'rep') return 'building_rep'
  return null
}

export function ResidentBadge({
  kind,
  className,
}: {
  kind: ResidentBadgeKind
  className?: string
}) {
  const meta = BADGE_META[kind]
  const Icon = meta.icon

  return (
    <Badge variant="outline" className={cn('gap-1.5 rounded-md px-2 py-1', meta.className, className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}

export function ResidentBadgeGroup({
  role,
  isVerified,
  isNew,
  className,
}: {
  role?: string | null
  isVerified?: boolean
  isNew?: boolean
  className?: string
}) {
  const roleBadge = roleToBadgeKind(role)

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {isVerified && <ResidentBadge kind="verified" />}
      {roleBadge && <ResidentBadge kind={roleBadge} />}
      {isNew && <ResidentBadge kind="new_neighbor" />}
    </div>
  )
}
