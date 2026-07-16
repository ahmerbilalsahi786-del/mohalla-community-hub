import { Link, useLocation } from 'wouter'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { Users, FileText, Building2, Megaphone, ShieldCheck, Flag, Palette, Phone, UserRoundCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useCurrentUser } from '@/hooks/use-current-user'

const TABS = [
  { label: 'Members',       href: '/admin/members',       icon: Users },
  { label: 'Posts',         href: '/admin/posts',         icon: FileText },
  { label: 'Community',     href: '/admin/community',     icon: Building2 },
  { label: 'Branding',      href: '/admin/branding',      icon: Palette },
  { label: 'Contacts',      href: '/admin/contacts',      icon: Phone },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Moderation',    href: '/admin/moderation',    icon: Flag },
  { label: 'Reviewers',     href: '/reviewers',           icon: UserRoundCheck },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { data: user } = useCurrentUser()
  const communityId = user?.community?.id
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['admin-members-pending-count', communityId],
    queryFn: async () => {
      if (!communityId) return 0
      const { data, error } = await (supabase as any)
        .rpc('admin_list_members', { requested_status: 'pending' })
      if (error) throw error
      return data?.length ?? 0
    },
    enabled: Boolean(communityId),
  })

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/4 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        {/* Admin sub-nav */}
        <div className="shrink-0 border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="px-3 py-2 sm:px-6 sm:py-0">
            <div className="mb-2 flex items-center justify-between sm:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Admin tools</p>
                  <p className="text-[11px] text-muted-foreground">Swipe to view all sections</p>
                </div>
              </div>
            </div>

            <nav
              aria-label="Admin sections"
              className="no-scrollbar flex snap-x snap-mandatory items-center gap-2 overflow-x-auto pb-1 sm:gap-1 sm:pb-0"
            >
              <div className="mr-4 hidden shrink-0 items-center gap-1.5 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <ShieldCheck size={14} className="text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Admin</span>
              </div>
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = location === tab.href
                const isPending = tab.href === '/admin/members' && pendingCount > 0
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors sm:min-h-0 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:px-3 sm:py-3 sm:font-medium',
                      active
                        ? 'border-primary/30 bg-primary/10 text-primary shadow-sm sm:border-primary sm:bg-transparent sm:shadow-none'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/60 hover:text-foreground sm:border-transparent sm:bg-transparent'
                    )}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {tab.label}
                    {isPending && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
