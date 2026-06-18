import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityCard } from '@/components/dashboard/activity-card'
import { EventCard } from '@/components/dashboard/event-card'
import { CommunityChart } from '@/components/dashboard/community-chart'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { MemberCard } from '@/components/dashboard/member-card'
import { Users, Calendar, MessageSquare, Heart, TrendingUp } from 'lucide-react'
import { SafetyWidget } from '@/components/dashboard/safety-widget'

const stats = [
  {
    title: 'Community Members',
    value: '2,847',
    change: '+12%',
    changeType: 'positive' as const,
    description: 'from last month',
    icon: Users,
    iconColor: 'bg-primary/10 text-primary',
  },
  {
    title: 'Active Events',
    value: '24',
    change: '+3',
    changeType: 'positive' as const,
    description: 'this week',
    icon: Calendar,
    iconColor: 'bg-accent/10 text-accent',
  },
  {
    title: 'Messages Today',
    value: '156',
    change: '+28%',
    changeType: 'positive' as const,
    description: 'engagement up',
    icon: MessageSquare,
    iconColor: 'bg-amber-500/10 text-amber-600',
  },
  {
    title: 'Volunteer Hours',
    value: '842',
    change: '+18%',
    changeType: 'positive' as const,
    description: 'this month',
    icon: Heart,
    iconColor: 'bg-pink-500/10 text-pink-600',
  },
]

const activities = [
  {
    id: '1',
    user: 'Fatima Ahmed',
    action: 'created a new event',
    target: 'Eid Community Feast',
    time: '2 minutes ago',
    type: 'event' as const,
  },
  {
    id: '2',
    user: 'Hassan Ali',
    action: 'joined',
    target: 'Sports Club',
    time: '15 minutes ago',
    type: 'join' as const,
  },
  {
    id: '3',
    user: 'Ayesha Khan',
    action: 'posted in',
    target: 'General Discussion',
    time: '32 minutes ago',
    type: 'post' as const,
  },
  {
    id: '4',
    user: 'Omar Malik',
    action: 'commented on',
    target: 'Street Cleaning Drive',
    time: '1 hour ago',
    type: 'comment' as const,
  },
  {
    id: '5',
    user: 'Zainab Hussain',
    action: 'liked your post',
    target: 'Community Garden Update',
    time: '2 hours ago',
    type: 'like' as const,
  },
]

const upcomingEvents = [
  {
    id: '1',
    title: 'Weekly Cricket Match',
    description: 'Join us for our weekly cricket match at the community ground. All skill levels welcome!',
    date: '2026-05-24',
    time: '6:00 PM',
    location: 'Community Ground',
    attendees: 28,
    maxAttendees: 30,
    category: 'Sports',
  },
  {
    id: '2',
    title: 'Ramadan Iftar Gathering',
    description: 'Community iftar where neighbors come together to break their fast. Please bring a dish to share.',
    date: '2026-05-26',
    time: '7:15 PM',
    location: 'Central Mosque',
    attendees: 156,
    category: 'Community',
  },
]

const compactEvents = [
  {
    id: '3',
    title: "Women's Fitness Class",
    description: '',
    date: '2026-05-25',
    time: '9:00 AM',
    location: 'Park Area',
    attendees: 18,
    category: 'Sports',
  },
  {
    id: '4',
    title: 'Kids Art Workshop',
    description: '',
    date: '2026-05-27',
    time: '3:00 PM',
    location: 'Community Center',
    attendees: 25,
    category: 'Education',
  },
  {
    id: '5',
    title: 'Local Food Festival',
    description: '',
    date: '2026-05-28',
    time: '5:00 PM',
    location: 'Main Street',
    attendees: 89,
    category: 'Food',
  },
]

const activeMembers = [
  {
    id: '1',
    name: 'Bilal Raza',
    role: 'Community Moderator',
    isOnline: true,
    mutualConnections: 12,
  },
  {
    id: '2',
    name: 'Sara Qureshi',
    role: 'Event Organizer',
    isOnline: true,
    mutualConnections: 8,
  },
  {
    id: '3',
    name: 'Imran Shah',
    role: 'Volunteer Coordinator',
    isOnline: false,
    mutualConnections: 15,
  },
  {
    id: '4',
    name: 'Nadia Farooq',
    role: 'New Member',
    isOnline: true,
    mutualConnections: 3,
  },
]

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute bottom-1/4 left-1/2 h-80 w-80 rounded-full bg-primary/3 blur-3xl" />
      </div>

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
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">Assalam-o-Alaikum, Ahmed!</h2>
                <p className="text-muted-foreground">Here&apos;s what&apos;s happening in your mohalla today</p>
              </div>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <CommunityChart />

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Upcoming Events</h3>
                  <button className="text-sm font-medium text-primary hover:text-primary/80">
                    View all
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">More This Week</h4>
                {compactEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="compact" />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <SafetyWidget />
              <QuickActions />
              <ActivityCard activities={activities} />
              <MemberCard members={activeMembers} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="hidden border-t border-border bg-muted/20 px-6 py-4 md:block">
          <p className="text-center text-xs text-muted-foreground">
            © 2025 Mohalla &nbsp;·&nbsp; Made in Pakistan 🇵🇰
          </p>
        </footer>
      </div>
    </div>
  )
}
