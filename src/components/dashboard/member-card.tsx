import { Link } from 'wouter'
import { cn } from '@/lib/utils'

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
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Decorative blob */}
      <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-card-foreground">Community Members</h3>
          <p className="text-sm text-muted-foreground">People in your mohalla</p>
        </div>
        <Link href="/community" className="text-sm font-medium text-primary hover:text-primary/80">
          See all
        </Link>
      </div>

      {/* Members List */}
      <div className="divide-y divide-border">
        {members.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">No members to show yet.</p>
        ) : members.map((member) => (
          <Link
            key={member.id}
            href={member.href}
            className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
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
            <div className="flex-1 min-w-0">
              <h4 className="truncate font-semibold text-card-foreground">{member.name}</h4>
              <p className="text-sm text-muted-foreground">{member.role}</p>
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
