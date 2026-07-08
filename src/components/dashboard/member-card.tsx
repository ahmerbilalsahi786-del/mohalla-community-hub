import { Link } from 'wouter'
import { cn } from '@/lib/utils'
import { titleCaseWords } from '@/lib/format-label'
import { CommunityEmptyState } from '@/components/community/community-empty-state'
import { ResidentBadgeGroup } from '@/components/community/resident-badge'

interface Member {
  id: string
  name: string
  role: string
  avatar?: string
  isVerified: boolean
  href: string
  mutualConnections?: number
}

interface MemberCardProps {
  members: Member[]
}

export function MemberCard({ members }: MemberCardProps) {
  return (
    <div className="portal-panel relative overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b portal-soft-rule px-5 py-4">
        <div className="min-w-0">
          <h3 className="portal-section-title text-lg text-card-foreground">Community Members</h3>
          <p className="text-sm text-muted-foreground">People in your mohalla</p>
        </div>
        <Link href="/community" className="shrink-0 text-sm font-black text-primary hover:text-primary/80">
          See all
        </Link>
      </div>

      {/* Members List */}
      <div className="divide-y divide-border">
        {members.length === 0 ? (
          <CommunityEmptyState kind="members" compact className="border-0 bg-transparent py-8 shadow-none" />
        ) : members.map((member) => (
          <Link
            key={member.id}
            href={member.href}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/30"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/50 to-accent/50" />
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card',
                  member.isVerified ? 'bg-green-500' : 'bg-muted-foreground/30'
                )}
                title={member.isVerified ? 'Verified member' : 'Verification pending'}
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-semibold text-card-foreground">{member.name}</h4>
              <p className="text-sm text-muted-foreground">{titleCaseWords(member.role)}</p>
              <ResidentBadgeGroup
                role={member.role}
                isVerified={member.isVerified}
                className="mt-2"
              />
              {member.mutualConnections && (
                <p className="text-xs text-muted-foreground">
                  {member.mutualConnections} mutual connections
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
