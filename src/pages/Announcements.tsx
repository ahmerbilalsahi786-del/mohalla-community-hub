import { Link } from 'wouter'
import { Megaphone, Pin, Search, Share2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { useListPosts } from '@/lib/generated/api'
import { CommunityEmptyState } from '@/components/community/community-empty-state'
import { FeedPostSkeleton } from '@/components/community/skeleton-states'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import { UserAvatar } from '@/components/community/user-avatar'
import { SmartImageGallery } from '@/components/shared/SmartImageGrid'

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function buildShareText(title: string) {
  return `Mohalla announcement: ${title}. Open the Mohalla app for details.`
}

export default function Announcements() {
  const { data: user } = useCurrentUser()
  const canCreateAnnouncement = canManageCommunity(user?.role)
  const { data, isLoading } = useListPosts({
    communityId: 'default',
    category: 'announcement',
    page: 1,
    limit: 30,
  })

  const announcements = data?.posts ?? []
  const pinned = announcements.filter((post) => post.isPinned)
  const regular = announcements.filter((post) => !post.isPinned)

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-xl border portal-soft-rule bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="portal-chip mb-3 w-fit border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <Megaphone className="h-3.5 w-3.5" />
                Official notices
              </div>
              <h2 className="portal-section-title text-2xl text-foreground sm:text-3xl">Community Announcements</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Important updates from the society team, organized separately from daily feed conversations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreateAnnouncement && (
                <Link href="/feed?compose=1&type=announcement">
                  <Button className="gap-2 rounded-xl bg-primary text-primary-foreground">
                    <Megaphone size={16} />
                    Create Announcement
                  </Button>
                </Link>
              )}
              <Link href="/feed?category=announcement">
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Search size={16} />
                  View in Feed
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <FeedPostSkeleton key={item} />)}
          </div>
        ) : announcements.length === 0 ? (
          <CommunityEmptyState
            kind="generic"
            title="No announcements yet"
            description="Official notices from your community admins will appear here."
            action={canCreateAnnouncement ? 'Create Announcement' : undefined}
            href={canCreateAnnouncement ? '/feed?compose=1&type=announcement' : undefined}
            className="min-h-[360px]"
          />
        ) : (
          <div className="space-y-6">
            {pinned.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-black uppercase text-muted-foreground">
                  <Pin className="h-4 w-4 text-primary" />
                  Pinned notices
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {pinned.map((post) => (
                    <AnnouncementCard key={post.id} post={post} featured />
                  ))}
                </div>
              </section>
            )}

            {regular.length > 0 && (
              <section className="space-y-3">
                <div className="text-sm font-black uppercase text-muted-foreground">Recent announcements</div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {regular.map((post) => (
                    <AnnouncementCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function AnnouncementCard({
  post,
  featured,
}: {
  post: {
    id: number
    title: string
    body: string
    userName: string
    unitNumber: string
    avatarUrl?: string | null
    imageUrls?: string[]
    createdAt: string
    isPinned: boolean
  }
  featured?: boolean
}) {
  const shareText = buildShareText(post.title)

  return (
    <article className="premium-card overflow-hidden rounded-xl border portal-soft-rule bg-card p-5 shadow-sm">
      {post.imageUrls?.length ? (
        <SmartImageGallery
          images={post.imageUrls.slice(0, 1)}
          title={post.title}
          className="-mx-5 -mt-5 mb-5 rounded-none border-x-0 border-t-0"
        />
      ) : null}

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Megaphone className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-muted-foreground">{featured ? 'Pinned announcement' : 'Announcement'}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <UserAvatar name={post.userName || 'Community admin'} src={post.avatarUrl} className="h-6 w-6" fallbackClassName="text-[9px]" />
              <span>{post.userName || 'Community admin'} · {timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        {post.isPinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
            <Pin className="h-3 w-3" />
            Pinned
          </span>
        )}
      </div>

      <h3 className="text-lg font-black leading-snug text-foreground">{post.title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{post.body}</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t portal-soft-rule pt-4">
        <span className="text-xs font-semibold text-muted-foreground">{post.unitNumber || 'Official notice'}</span>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border portal-soft-rule bg-background/70 px-3 text-xs font-bold text-foreground transition-colors hover:bg-secondary/60"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </a>
      </div>
    </article>
  )
}
