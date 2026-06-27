import { Link, useLocation } from 'wouter'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { Users, FileText, Building2, Megaphone, ShieldCheck, Flag, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useCurrentUser } from '@/hooks/use-current-user'

const TABS = [
  { label: 'Members',       href: '/admin/members',       icon: Users },
  { label: 'Posts',         href: '/admin/posts',         icon: FileText },
  { label: 'Community',     href: '/admin/community',     icon: Building2 },
  { label: 'Branding',      href: '/admin/branding',      icon: Palette },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Moderation',    href: '/admin/moderation',    icon: Flag },
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
    <div className="flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/4 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/4 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        {/* Admin sub-nav */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-1 px-6 overflow-x-auto">
            <div className="flex items-center gap-1.5 mr-4 shrink-0">
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
                <Link key={tab.href} href={tab.href}>
                  <div className={cn(
                    'relative flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition-colors cursor-pointer shrink-0',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}>
                    <Icon size={15} />
                    {tab.label}
                    {isPending && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
