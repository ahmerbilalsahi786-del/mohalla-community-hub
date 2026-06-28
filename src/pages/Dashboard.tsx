import { Link } from 'wouter'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Calendar, MessageSquare, ShoppingBag, Sparkles, TrendingUp, UserCheck, Users } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityCard } from '@/components/dashboard/activity-card'
import { EventCard } from '@/components/dashboard/event-card'
import { CommunityChart } from '@/components/dashboard/community-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { MemberCard } from '@/components/dashboard/member-card'
import { SafetyWidget } from '@/components/dashboard/safety-widget'
import { EmergencyServicesWidget } from '@/components/dashboard/emergency-services-widget'
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
  const communityName = user?.community?.name ?? 'your mohalla'
  const summaryLine = isManager
    ? `${stats.pendingMembers} approvals waiting, ${stats.postsThisMonth} fresh updates, and ${upcomingEvents.length} events on deck.`
    : `${upcomingEvents.length} events, ${stats.activeListings} active listings, and ${stats.postsThisMonth} new conversations this month.`

  const statCards = [
    {
      title: 'Community Members',
      value: stats.totalMembers,
      description: 'registered residents',
      icon: Users,
      iconColor: 'bg-primary/10 text-primary',
      href: '/community',
    },
    {
      title: 'Upcoming Events',
      value: upcomingEvents.length,
      description: 'scheduled now',
      icon: Calendar,
      iconColor: 'bg-accent/10 text-accent',
      href: '/events',
    },
    {
      title: 'Posts This Month',
      value: stats.postsThisMonth,
      description: 'community updates',
      icon: MessageSquare,
      iconColor: 'bg-amber-500/10 text-amber-600',
      href: '/feed',
    },
    isManager
      ? {
          title: 'Pending Approvals',
          value: stats.pendingMembers,
          description: 'members to review',
          icon: UserCheck,
          iconColor: 'bg-pink-500/10 text-pink-600',
          href: '/admin/members',
        }
      : {
          title: 'Active Listings',
          value: stats.activeListings,
          description: 'marketplace items',
          icon: ShoppingBag,
          iconColor: 'bg-pink-500/10 text-pink-600',
          href: '/marketplace',
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
    <DashboardShell>
      <div className="space-y-6">
        <section className="portal-panel overflow-hidden rounded-[2rem] p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <div className="portal-chip w-fit text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Live Community Snapshot
              </div>
              <div className="space-y-3">
                <h2 className="portal-section-title text-3xl leading-tight text-foreground sm:text-4xl">
                  Assalam-o-Alaikum, {firstName}. {communityName} feels active today.
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {summaryLine}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
              <Link href="/feed?compose=1" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90">
                Share update <ArrowRight size={16} />
              </Link>
                <Link href={isManager ? '/admin/members' : '/events'} className="inline-flex items-center gap-2 rounded-2xl border portal-soft-rule bg-card/80 px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-card">
                  {isManager ? 'Review approvals' : 'See upcoming events'}
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.4rem] border portal-soft-rule bg-card/80 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Pulse</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats.postsThisMonth}</p>
                <p className="mt-1 text-sm text-muted-foreground">posts and announcements this month</p>
              </div>
              <div className="rounded-[1.4rem] border portal-soft-rule bg-card/80 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Calendar</p>
                <p className="mt-2 text-2xl font-black text-foreground">{upcomingEvents.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">upcoming neighborhood moments</p>
              </div>
              <div className="rounded-[1.4rem] border portal-soft-rule bg-card/80 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Residents</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats.totalMembers}</p>
                <p className="mt-1 text-sm text-muted-foreground">verified members connected</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.95fr)]">
          <div className="space-y-6">
            <CommunityChart />

            <section className="portal-panel rounded-[1.9rem] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="portal-section-title text-xl text-foreground">Upcoming Events</h3>
                  <p className="text-sm text-muted-foreground">What the neighborhood is gathering around next</p>
                </div>
                <Link href="/events" className="text-sm font-black text-primary hover:text-primary/80">
                  View all
                </Link>
              </div>
              {featuredEvents.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {events.slice(0, 2).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed portal-soft-rule bg-card/70 p-8 text-center text-sm text-muted-foreground">
                  No upcoming events have been scheduled.
                </div>
              )}
            </section>

            {compactEvents.length > 0 && (
              <section className="portal-panel rounded-[1.9rem] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="portal-section-title text-lg text-foreground">More On The Calendar</h4>
                    <p className="text-sm text-muted-foreground">Additional events residents can join soon</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {events.slice(2).map((event) => (
                    <EventCard key={event.id} event={event} variant="compact" />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <EmergencyServicesWidget />
            <SafetyWidget />
            <QuickActions />
            <ActivityCard activities={activities} />
            <MemberCard members={activeMembers} />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
