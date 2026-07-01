import { useEffect, useMemo, useState } from 'react'
import { Link } from 'wouter'
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
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import {
  useAdminGetStats,
  useAdminListMembers,
  useListEvents,
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
      className="max-w-3xl rounded-2xl border portal-soft-rule bg-card/80 p-3 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Flame className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground">Daily pulse</p>
            <p className="truncate text-xs text-muted-foreground">Posts and hot topics trending now</p>
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
            className="group min-h-32 rounded-xl border portal-soft-rule bg-background/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="rounded-full border portal-soft-rule bg-card/80 px-2.5 py-1 text-[11px] font-black uppercase text-primary">
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
  const approvalLabel = stats.pendingMembers === 1 ? 'approval' : 'approvals'
  const eventLabel = upcomingEvents.length === 1 ? 'event' : 'events'
  const summaryLine = isManager
    ? `${stats.pendingMembers} ${approvalLabel} waiting, ${stats.postsThisMonth} fresh updates, and ${upcomingEvents.length} ${eventLabel} on deck.`
    : `${upcomingEvents.length} ${eventLabel}, ${stats.activeListings} active listings, and ${stats.postsThisMonth} new conversations this month.`

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

  const trendingTopics = useMemo<TrendingTopic[]>(() => {
    const postTopics = recentPosts.map((post) => ({
      id: `post-${post.id}`,
      label: post.type === 'announcement' ? 'Notice' : post.type === 'safety' ? 'Safety' : 'Post',
      title: post.title || 'Community update',
      description: post.body || `${post.userName || 'A resident'} shared a new update.`,
      meta: `${post.userName || 'Resident'} · ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}`,
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
      <div className="space-y-5">
        <section className="portal-panel overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-stretch">
            <div className="space-y-5">
              <div className="portal-chip w-fit text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Live Community Snapshot
              </div>
              <div className="space-y-3">
                <h2 className="portal-section-title max-w-3xl text-2xl leading-tight text-foreground sm:text-3xl">
                  Assalam-o-Alaikum, {firstName}. {communityName} feels active today.
                </h2>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {summaryLine}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/feed?compose=1" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition-colors hover:bg-primary/90">
                  Share update <ArrowRight size={16} />
                </Link>
                <Link href={isManager ? '/admin/members' : '/events'} className="inline-flex min-h-11 items-center gap-2 rounded-xl border portal-soft-rule bg-card/90 px-4 py-2.5 text-sm font-black text-foreground transition-colors hover:bg-card">
                  {isManager ? 'Review approvals' : 'See upcoming events'}
                </Link>
              </div>

              <TrendingTopicsSlideshow topics={trendingTopics} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-xl border portal-soft-rule bg-card/90 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase text-muted-foreground">Pulse</p>
                <p className="mt-2 text-2xl font-black text-foreground">{stats.postsThisMonth}</p>
                <p className="mt-1 text-sm text-muted-foreground">posts and announcements this month</p>
              </div>
              <div className="rounded-xl border portal-soft-rule bg-card/90 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase text-muted-foreground">Calendar</p>
                <p className="mt-2 text-2xl font-black text-foreground">{upcomingEvents.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">upcoming neighborhood moments</p>
              </div>
              <div className="rounded-xl border portal-soft-rule bg-card/90 p-4">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase text-muted-foreground">Residents</p>
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

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-5">
            <CommunityChart />

            <section className="portal-panel rounded-2xl p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
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
                <div className="rounded-xl border border-dashed portal-soft-rule bg-card/70 p-8 text-center text-sm text-muted-foreground">
                  No upcoming events have been scheduled.
                </div>
              )}
            </section>

            {compactEvents.length > 0 && (
              <section className="portal-panel rounded-2xl p-5 sm:p-6">
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

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-24">
            <EmergencyServicesWidget />
            <SafetyWidget />
            <QuickActions />
            <ActivityCard activities={activities} />
            <MemberCard members={activeMembers} />
          </aside>
        </div>
      </div>
    </DashboardShell>
  )
}
