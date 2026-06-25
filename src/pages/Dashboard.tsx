import { Link } from 'wouter'
import { formatDistanceToNow } from 'date-fns'
import { Calendar, MessageSquare, ShoppingBag, TrendingUp, UserCheck, Users } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityCard } from '@/components/dashboard/activity-card'
import { EventCard } from '@/components/dashboard/event-card'
import { CommunityChart } from '@/components/dashboard/community-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { MemberCard } from '@/components/dashboard/member-card'
import { SafetyWidget } from '@/components/dashboard/safety-widget'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import {
  useAdminGetStats,
  useAdminListMembers,
  useListEvents,
  useListPosts,
} from '@/lib/generated/api'

export default function Dashboard() {
  const { data: user } = useCurrentUser()
  const { data: statsData } = useAdminGetStats({ communityId: 'default' })
  const { data: eventData } = useListEvents({ communityId: 'default' })
  const { data: postData } = useListPosts({ communityId: 'default', page: 1, limit: 5 })
  const { data: memberData = [] } = useAdminListMembers({ communityId: 'default' })

  const stats = statsData ?? {
    totalMembers: 0,
    postsThisMonth: 0,
    activeListings: 0,
    pendingMembers: 0,
  }
  const upcomingEvents = ((eventData?.upcoming ?? []) as any[]).slice(0, 5)
  const featuredEvents = upcomingEvents.slice(0, 2)
  const compactEvents = upcomingEvents.slice(2)
  const recentPosts = ((postData?.posts ?? []) as any[]).slice(0, 5)
  const members = (memberData as any[]).slice(0, 4)
  const isManager = canManageCommunity(user?.role)
  const firstName = user?.name?.split(/\s+/)[0] || 'Neighbor'

  const statCards = [
    {
      title: 'Community Members',
      value: stats.totalMembers,
      description: 'registered residents',
      icon: Users,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      title: 'Upcoming Events',
      value: upcomingEvents.length,
      description: 'scheduled now',
      icon: Calendar,
      iconColor: 'bg-accent/10 text-accent',
    },
    {
      title: 'Posts This Month',
      value: stats.postsThisMonth,
      description: 'community updates',
      icon: MessageSquare,
      iconColor: 'bg-amber-500/10 text-amber-600',
    },
    isManager
      ? {
          title: 'Pending Approvals',
          value: stats.pendingMembers,
          description: 'members to review',
          icon: UserCheck,
          iconColor: 'bg-pink-500/10 text-pink-600',
        }
      : {
          title: 'Active Listings',
          value: stats.activeListings,
          description: 'marketplace items',
          icon: ShoppingBag,
          iconColor: 'bg-pink-500/10 text-pink-600',
        },
  ]

  const activities = recentPosts.map((post) => ({
    id: String(post.id),
    user: post.userName || 'Resident',
    action: 'posted',
    target: post.title || 'a community update',
    time: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
    type: 'post' as const,
  }))

  const events = upcomingEvents.map((event) => ({
    id: String(event.id),
    title: event.title,
    description: event.description || '',
    date: event.date,
    time: event.time || 'Time to be announced',
    location: event.location || 'Community',
    attendees: event.rsvpCount ?? 0,
    category: 'Community',
  }))

  const activeMembers = members.map((member) => ({
    id: String(member.id),
    name: member.name || 'Resident',
    role: member.role === 'admin' ? 'Community Admin' : member.role === 'moderator' ? 'Moderator' : 'Member',
    isVerified: Boolean(member.isVerified),
    href: `/profile/${member.userId ?? member.id}`,
  }))

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="mb-8">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">Assalam-o-Alaikum, {firstName}!</h2>
                <p className="text-muted-foreground">
                  {isManager ? 'Here is the latest community overview' : 'Here is what is happening in your mohalla'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <CommunityChart />

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Upcoming Events</h3>
                  <Link href="/events" className="text-sm font-medium text-primary hover:text-primary/80">
                    View all
                  </Link>
                </div>
                {featuredEvents.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {events.slice(0, 2).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No upcoming events have been scheduled.
                  </div>
                )}
              </div>

              {compactEvents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">More Upcoming</h4>
                  {events.slice(2).map((event) => (
                    <EventCard key={event.id} event={event} variant="compact" />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <SafetyWidget />
              <QuickActions />
              <ActivityCard activities={activities} />
              <MemberCard members={activeMembers} />
            </div>
          </div>
        </main>

        <footer className="hidden border-t border-border bg-muted/20 px-6 py-4 md:block">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mohalla
          </p>
        </footer>
      </div>
    </div>
  )
}
