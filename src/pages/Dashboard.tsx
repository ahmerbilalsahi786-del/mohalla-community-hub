import { useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Calendar, Flame, MessageSquare, ShoppingBag, Sparkles, TrendingUp, UserCheck, Users } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityCard } from '@/components/dashboard/activity-card'
import { EventCard } from '@/components/dashboard/event-card'
import { CommunityChart } from '@/components/dashboard/community-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { MemberCard } from '@/components/dashboard/member-card'
import { SafetyWidget } from '@/components/dashboard/safety-widget'
import { EmergencyServicesWidget } from '@/components/dashboard/emergency-services-widget'
import { HealthScoreCard } from '@/components/dashboard/health-score-card'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import {
  useAdminGetStats,
  useListAlerts,
  useListEvents,
  useListListings,
  useListPosts,
} from '@/lib/generated/api'

type TrendingTopic = {
  id: string
  label: string
  title: string
  description: string
  meta: string
  href: string
  tone: string
}

function TrendingTopicsSlideshow({ topics }: { topics: TrendingTopic[] }) {
  const pageCount = Math.max(1, Math.ceil(topics.length / 2))
  const pages = useMemo(() => {
    const pairs: TrendingTopic[][] = []
    for (let i = 0; i < topics.length; i += 2) {
      const pair = topics.slice(i, i + 2)
      if (pair.length === 1 && topics.length > 1) pair.push(topics[0])
      pairs.push(pair)
    }
    return pairs
  }, [topics])
  const [page, setPage] = useState(0)

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  useEffect(() => {
    if (pageCount <= 1) return undefined
    const timer = window.setTimeout(() => {
      setPage((current) => (current + 1) % pageCount)
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [page, pageCount])

  const visibleTopics = pages[page] ?? pages[0] ?? []

  return (
    <div
      data-topic-slideshow
      data-active-page={page}
      data-page-count={pages.length}
      className="delight-float-soft max-w-3xl rounded-xl border portal-soft-rule bg-card p-3 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flame className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground">Community Pulse</p>
            <p className="truncate text-xs text-muted-foreground">Updates gaining attention now</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5" aria-hidden="true">
          {pages.map((_, index) => (
            <span
              key={index}
              className={index === page ? 'h-1.5 w-5 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/30'}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        {visibleTopics.map((topic) => (
          <Link
            key={`${page}-${topic.id}`}
            href={topic.href}
            className="group min-h-32 rounded-xl border portal-soft-rule bg-background/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/45"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="rounded-full border portal-soft-rule bg-card px-2.5 py-1 text-[11px] font-black uppercase text-primary">
                {topic.label}
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${topic.tone}`} />
            </div>
            <p className="line-clamp-2 text-sm font-black leading-snug text-foreground">{topic.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{topic.description}</p>
            <p className="mt-3 truncate text-[11px] font-semibold text-muted-foreground">{topic.meta}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: user } = useCurrentUser()
  const isManager = canManageCommunity(user?.role)
  const { data: statsData } = useAdminGetStats(
    { communityId: 'default' },
    { query: { queryKey: ['/api/admin/stats', { communityId: 'default' }], enabled: isManager } },
  )
  const { data: eventData, isLoading: eventsLoading } = useListEvents({ communityId: 'default' })
  const { data: postData, isLoading: postsLoading } = useListPosts({ communityId: 'default', page: 1, limit: 5 })
  const { data: listingData, isLoading: listingsLoading } = useListListings({ communityId: 'default', page: 1, limit: 1 })
  const { data: alertData = [], isLoading: alertsLoading } = useListAlerts({ communityId: 'default' })
  const { data: memberData = [], isLoading: membersLoading } = useQuery({
    queryKey: ['dashboard-community-members'],
    queryFn: async () => {
      const response = await fetch('/api/community/members?status=approved&limit=200')
      if (!response.ok) throw new Error('Could not load community members.')
      return response.json()
    },
    refetchInterval: 30000,
  })
  const statsLoading = eventsLoading || postsLoading || alertsLoading || membersLoading || listingsLoading

  const stats = {
    totalMembers: statsData?.totalMembers ?? (memberData as any[]).length,
    postsThisMonth: statsData?.postsThisMonth ?? postData?.total ?? 0,
    activeListings: statsData?.activeListings ?? listingData?.total ?? 0,
    pendingMembers: statsData?.pendingMembers ?? 0,
  }
  const upcomingEvents = ((eventData?.upcoming ?? []) as any[]).slice(0, 5)
  const featuredEvents = upcomingEvents.slice(0, 2)
  const compactEvents = upcomingEvents.slice(2)
  const recentPosts = ((postData?.posts ?? []) as any[]).slice(0, 5)
  const members = (memberData as any[]).slice(0, 4)
  const activeSafetyAlerts = (alertData as any[]).filter((alert) => !alert.isResolved).length
  const resolvedComplaints = recentPosts.filter((post) => post.type === 'complaint' && post.status === 'resolved').length
  const firstName = user?.name?.split(/\s+/)[0] || 'Neighbor'
  const communityName = user?.community?.name ?? 'your mohalla'
  const approvalLabel = stats.pendingMembers === 1 ? 'approval' : 'approvals'
  const eventLabel = upcomingEvents.length === 1 ? 'event' : 'events'
  const summaryLine = isManager
    ? `${stats.pendingMembers} ${approvalLabel} waiting, ${stats.postsThisMonth} community updates, and ${upcomingEvents.length} ${eventLabel} on the calendar.`
    : `${upcomingEvents.length} ${eventLabel} on the calendar, ${stats.activeListings} active listings, and ${stats.postsThisMonth} community updates.`

  const statCards = [
    {
      title: 'Community Pulse',
      value: stats.postsThisMonth,
      description: stats.postsThisMonth === 1 ? 'community update' : 'community updates',
      icon: TrendingUp,
      iconColor: 'bg-primary/10 text-primary',
      href: '/feed',
    },
    {
      title: 'Upcoming Events',
      value: upcomingEvents.length,
      description: upcomingEvents.length > 0 ? `${upcomingEvents.length} ${eventLabel} scheduled` : 'No events yet',
      icon: Calendar,
      iconColor: 'bg-accent/10 text-accent',
      href: '/events',
    },
    {
      title: 'Verified Residents',
      value: stats.totalMembers,
      description: 'verified residents connected',
      icon: Users,
      iconColor: 'bg-green-500/10 text-green-700 dark:text-green-300',
      href: '/community',
    },
    isManager
      ? {
          title: 'Pending Approvals',
          value: stats.pendingMembers,
          description: stats.pendingMembers === 1 ? 'waiting review' : 'waiting review',
          icon: UserCheck,
          iconColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
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

  const trendingTopics = useMemo<TrendingTopic[]>(() => {
    const postTopics = recentPosts.map((post) => ({
      id: `post-${post.id}`,
      label: post.type === 'announcement' ? 'Notice' : post.type === 'safety' ? 'Safety' : 'Post',
      title: post.title || 'Community update',
      description: post.body || `${post.userName || 'A resident'} shared a new update.`,
      meta: `${post.userName || 'Resident'} - ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}`,
      href: '/feed',
      tone: post.type === 'safety' ? 'bg-red-500' : post.type === 'announcement' ? 'bg-amber-500' : 'bg-primary',
    }))

    const fallbackTopics: TrendingTopic[] = [
      {
        id: 'approvals',
        label: isManager ? 'Admin' : 'People',
        title: isManager ? `${stats.pendingMembers} ${approvalLabel} waiting` : `${stats.totalMembers} neighbors connected`,
        description: isManager ? 'Review new residents and keep the community trusted.' : 'See who is active in your mohalla today.',
        meta: isManager ? 'Admin queue' : 'Community directory',
        href: isManager ? '/admin/members' : '/community',
        tone: 'bg-pink-500',
      },
      {
        id: 'posts',
        label: 'Hot topic',
        title: `${stats.postsThisMonth} fresh updates this month`,
        description: 'Catch up on daily posts, notices, and neighbor conversations.',
        meta: 'Community feed',
        href: '/feed',
        tone: 'bg-primary',
      },
      {
        id: 'events',
        label: 'Calendar',
        title: `${upcomingEvents.length} ${eventLabel} coming up`,
        description: upcomingEvents[0]?.title || 'No event is scheduled yet. Start the next gathering.',
        meta: upcomingEvents[0]?.date ? formatDistanceToNow(new Date(`${upcomingEvents[0].date}T00:00:00`), { addSuffix: true }) : 'Events',
        href: '/events',
        tone: 'bg-accent',
      },
      {
        id: 'marketplace',
        label: 'Market',
        title: `${stats.activeListings} active marketplace listings`,
        description: 'Browse useful items, services, and neighbor-to-neighbor offers.',
        meta: 'Marketplace',
        href: '/marketplace',
        tone: 'bg-amber-500',
      },
    ]

    return [...postTopics, ...fallbackTopics].slice(0, 8)
  }, [approvalLabel, eventLabel, isManager, recentPosts, stats.activeListings, stats.pendingMembers, stats.postsThisMonth, stats.totalMembers, upcomingEvents])

  const activities = recentPosts.map((post) => ({
    id: String(post.id),
    user: post.userName || 'Resident',
    action: 'posted',
    target: post.title || 'a community update',
    avatar: post.avatarUrl ?? null,
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
    avatar: member.avatarUrl ?? null,
    isVerified: Boolean(member.isVerified),
    href: `/profile/${member.userId ?? member.id}`,
  }))

  return (
    <DashboardShell>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="contents xl:block xl:space-y-5">
          <section className="order-1 relative overflow-hidden rounded-xl border portal-soft-rule bg-card p-5 shadow-sm sm:p-6">
            <div className="space-y-5">
              <div className="portal-chip w-fit border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Today in {communityName}
              </div>
              <div className="space-y-3">
                <h2 className="portal-section-title max-w-3xl text-2xl leading-tight text-foreground sm:text-3xl">
                  Assalam-o-Alaikum, {firstName} - your mohalla is active today.
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {summaryLine}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/feed?compose=1" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover">
                  Share update <ArrowRight size={16} />
                </Link>
                <Link href={isManager ? '/admin/members' : '/events'} className="inline-flex min-h-11 items-center gap-2 rounded-lg border portal-soft-rule bg-card px-4 py-2.5 text-sm font-black text-foreground transition-colors hover:bg-secondary/55">
                  {isManager ? 'Review pending approvals' : 'See upcoming events'}
                </Link>
              </div>

              <TrendingTopicsSlideshow topics={trendingTopics} />
            </div>
          </section>

          <div className="order-3 min-w-0 space-y-5">
            <CommunityChart />

            <section className="rounded-xl border portal-soft-rule bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="portal-section-title text-xl text-foreground">Upcoming Events</h3>
                  <p className="text-sm text-muted-foreground">What the neighborhood is gathering around next</p>
                </div>
                <Link href="/events" className="text-sm font-black text-primary hover:text-primary-hover">
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
                <div className="rounded-xl border border-dashed portal-soft-rule bg-background/70 p-8 text-center">
                  <p className="text-sm font-bold text-foreground">No upcoming events</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create the first gathering for residents.</p>
                  <Link href="/events" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover">
                    Create first event
                  </Link>
                </div>
              )}
            </section>

            {compactEvents.length > 0 && (
              <section className="rounded-xl border portal-soft-rule bg-card p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
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
        </div>

        <aside className="contents min-w-0 xl:sticky xl:top-24 xl:block">
          <div className="order-2 space-y-5">
            <QuickActions />
            <EmergencyServicesWidget />
            <div>
              <SafetyWidget />
            </div>

            <section aria-labelledby="community-overview-title">
              <h3 id="community-overview-title" className="sr-only">Community overview</h3>
              <div className="grid grid-cols-2 gap-3">
                {statsLoading
                  ? [1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-[118px] animate-pulse rounded-xl border portal-soft-rule bg-muted/60" />
                    ))
                  : statCards.map((stat) => (
                      <StatCard key={stat.title} {...stat} compact />
                    ))}
              </div>
            </section>
          </div>

          <div className="order-4 space-y-5 xl:mt-5">
            <HealthScoreCard
              postsThisMonth={stats.postsThisMonth}
              activeSafetyAlerts={activeSafetyAlerts}
              resolvedComplaints={resolvedComplaints}
              upcomingEvents={upcomingEvents.length}
              verifiedResidents={stats.totalMembers}
            />
            <ActivityCard activities={activities} />
            <MemberCard members={activeMembers} />
          </div>
        </aside>
      </div>
    </DashboardShell>
  )
}
