import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { useQuery } from '@tanstack/react-query'
import { Users, MapPin, Phone } from 'lucide-react'
import { Link } from 'wouter'
import { CommunityEmptyState } from '@/components/community/community-empty-state'
import { ResidentBadgeGroup } from '@/components/community/resident-badge'
import { ResidentListSkeleton } from '@/components/community/skeleton-states'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function Community() {
  const { data, isLoading } = useQuery({
    queryKey: ["community-members"],
    queryFn: async () => {
      const response = await fetch("/api/community/members?communityId=default");
      if (!response.ok) throw new Error("Could not load members.");
      return response.json();
    },
  })
  const members: any[] = Array.isArray(data) ? data : []

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Community Members</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isLoading ? 'Loading...' : `${members.length} neighbours in your mohalla`}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Users size={22} className="text-primary" />
              </div>
            </div>

            {isLoading ? (
              <ResidentListSkeleton rows={6} />
            ) : members.length === 0 ? (
              <CommunityEmptyState kind="members" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => {
                  return (
                    <Link key={m.id} href={`/profile/${m.userId}`}>
                      <div className="group cursor-pointer rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 font-bold text-white text-sm shrink-0">
                              {getInitials(m.name)}
                            </div>
                            {m.isActive && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{m.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin size={10} />
                              <span>Unit {m.unitNumber}</span>
                            </div>
                          </div>
                        </div>
                        <ResidentBadgeGroup
                          role={m.role}
                          isVerified={m.isVerified ?? m.status === 'approved'}
                          isNew={m.isNewNeighbor ?? m.isNew ?? false}
                          className="mb-3"
                        />
                        {m.whatsappNumber && (
                          <a
                            href={`https://wa.me/${m.whatsappNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-[#25D366] hover:underline"
                          >
                            <Phone size={11} />
                            Contact on WhatsApp
                          </a>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
