import { useState, useCallback, useEffect } from 'react'
import { useListPosts, useCreatePost, useToggleLike, useListComments, useCreateComment, useListEvents, useListPolls } from '@/lib/generated/api'
import { useQueryClient } from '@tanstack/react-query'
import { getListPostsQueryKey, getListCommentsQueryKey } from '@/lib/generated/api'

import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import {
  Pin, Heart, MessageSquare, Plus, X, ChevronDown, ChevronUp,
  Megaphone, Shield, Search, ShoppingBag, Calendar, Users, Send, Loader2,
  MapPin, BarChart2, ChevronRight, AlertTriangle, Flag, Trash2, UserX, MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Link, useLocation, useSearch } from 'wouter'
import { useCurrentUser } from '@/hooks/use-current-user'
import { PublicationToggle } from '@/components/city-feed/publication-toggle'
import { useStartConversation } from '@/lib/messages'
import { CommunityEmptyState } from '@/components/community/community-empty-state'
import { FeedPostSkeleton } from '@/components/community/skeleton-states'
import { PostTypeSelector } from '@/components/feed/post-type-selector'
import { UserAvatar } from '@/components/community/user-avatar'
import { PostImageGallery } from '@/components/feed/post-image-gallery'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { ImageAsset, imageUrls } from '@/lib/imageLayout'

type PostType = 'general' | 'announcement' | 'safety' | 'lost_found' | 'buy_sell' | 'event' | 'complaint'

// ─── Feed Widgets ─────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function pct(votes: number, total: number) {
  return total === 0 ? 0 : Math.round((votes / total) * 100)
}
function timeLeft(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return 'Ended'
  const h = Math.floor(ms / 3600000)
  return h < 24 ? `${h}h left` : `${Math.floor(h / 24)}d left`
}

function EventWidget() {
  const { data } = useListEvents({ communityId: 'default' })
  const upcoming = (data as any)?.upcoming ?? []
  if (!upcoming.length) return null
  const next = upcoming[0]
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-secondary/55 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Calendar size={14} className="text-primary" />
          Upcoming Event
        </div>
        <Link href="/events" className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover">
          All events <ChevronRight size={12} />
        </Link>
      </div>
      <div className="px-4 py-3">
        <p className="font-semibold text-foreground text-sm leading-snug">{next.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(next.date)}{next.time && ` - ${next.time}`}</span>
          {next.location && <span className="flex items-center gap-1"><MapPin size={11} />{next.location}</span>}
          <span className="flex items-center gap-1"><Users size={11} />{next.rsvpCount} attending</span>
        </div>
      </div>
      {upcoming.length > 1 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground">+{upcoming.length - 1} more upcoming event{upcoming.length > 2 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}

function PollWidget() {
  const { data } = useListPolls({ communityId: 'default', userId: 'ahmed' })
  const active = (data as any)?.active ?? []
  if (!active.length) return null
  const poll = active[0]
  const hasVoted = poll.myVoteIndex !== null
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-secondary/55 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <BarChart2 size={14} className="text-accent" />
          Community Poll
        </div>
        <Link href="/polls" className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover">
          All polls <ChevronRight size={12} />
        </Link>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm font-semibold text-foreground">{poll.question}</p>
        {hasVoted ? (
          <div className="space-y-1.5">
            {poll.options.map((opt: string, i: number) => {
              const p = pct(poll.voteCounts[i] ?? 0, poll.totalVotes)
              return (
                <div key={i} className="relative overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-1.5">
                  <div className={cn('absolute inset-0', poll.myVoteIndex === i ? 'bg-primary/20' : 'bg-muted/50')} style={{ width: `${p}%` }} />
                  <div className="relative flex items-center justify-between">
                    <span className={cn('text-xs', poll.myVoteIndex === i ? 'font-semibold text-primary' : 'text-foreground')}>{opt}</span>
                    <span className="text-xs text-muted-foreground ml-2">{p}%</span>
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground">{poll.totalVotes} votes - {timeLeft(poll.endsAt)}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-2">{poll.options.length} options - {timeLeft(poll.endsAt)}</p>
            <Link href="/polls" className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20">
              <BarChart2 size={11} /> Vote now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function ComplaintBar({ onCompose }: { onCompose: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50/80 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-red-950 dark:text-red-100">Report a neighborhood issue</p>
          <p className="text-xs leading-relaxed text-red-800/80 dark:text-red-200/80">Noise, parking, water, repairs, cleanliness</p>
        </div>
        <Button onClick={onCompose} className="h-10 shrink-0 rounded-lg bg-red-600 px-4 text-white hover:bg-red-700">
          File Report
        </Button>
      </div>
    </div>
  )
}

const CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all', label: 'All', icon: Users, color: 'text-foreground' },
  { value: 'announcement', label: 'Announcements', icon: Megaphone, color: 'text-amber-600' },
  { value: 'safety', label: 'Safety', icon: Shield, color: 'text-red-500' },
  { value: 'complaint', label: 'Complaints', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'lost_found', label: 'Lost & Found', icon: Search, color: 'text-blue-500' },
  { value: 'buy_sell', label: 'Buy & Sell', icon: ShoppingBag, color: 'text-green-600' },
  { value: 'event', label: 'Events', icon: Calendar, color: 'text-accent' },
]

const CATEGORY_BADGE: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  announcement: { label: 'Announcement', icon: Megaphone, className: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300' },
  safety: { label: 'Safety', icon: Shield, className: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300' },
  complaint: { label: 'Complaint', icon: AlertTriangle, className: 'bg-red-600/10 text-red-800 ring-red-600/20 dark:text-red-200' },
  lost_found: { label: 'Lost & Found', icon: Search, className: 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300' },
  buy_sell: { label: 'Buy & Sell', icon: ShoppingBag, className: 'bg-green-500/10 text-green-700 ring-green-500/20 dark:text-green-300' },
  event: { label: 'Event', icon: Calendar, className: 'bg-accent/10 text-accent ring-accent/20' },
  general: { label: 'Post', icon: MessageSquare, className: 'bg-secondary text-secondary-foreground ring-border' },
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function ResidentAvatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  return <UserAvatar name={name} src={avatarUrl} className={size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'} fallbackClassName={size === 'sm' ? 'text-xs' : 'text-sm'} />
}

function CommentSection({ postId }: { postId: number }) {
  const [commentBody, setCommentBody] = useState('')
  const { data: comments = [], isLoading } = useListComments(postId)
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(postId) })
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() })
        setCommentBody('')
      },
    },
  })

  const handleSubmit = () => {
    if (!commentBody.trim()) return
    createComment.mutate({ postId, data: { body: commentBody.trim() } })
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map(i => (
            <div key={i} className="flex animate-pulse gap-2.5">
              <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-8 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <ResidentAvatar name={c.userName} avatarUrl={c.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="rounded-lg bg-secondary/60 px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">{c.userName}</span>
                    <span className="text-xs text-muted-foreground">{c.unitNumber}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{c.body}</p>
                </div>
                <p className="mt-1 px-1 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <ResidentAvatar name={currentUser?.name ?? 'Resident'} avatarUrl={currentUser?.avatarUrl} size="sm" />
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm transition-colors focus:border-primary focus:bg-background focus:outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!commentBody.trim() || createComment.isPending}
            aria-label="Send comment"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

interface Post {
  id: number
  communityId: string
  userId: string
  userName: string
  unitNumber: string
  avatarUrl?: string | null
  type: string
  title: string
  body: string
  imageUrls: string[]
  isPinned: boolean
  likesCount: number
  commentsCount: number
  createdAt: string
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const badge = CATEGORY_BADGE[post.type] || CATEGORY_BADGE.general
  const BadgeIcon = badge.icon
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const { toast } = useToast()
  const [, navigate] = useLocation()
  const startConversation = useStartConversation()
  const isOwner = currentUser?.userId === post.userId

  const handleLike = () => {
    setLiked(!liked)
    onLike(post.id)
  }

  const deleteOwnPost = async () => {
    if (!window.confirm('Delete this post permanently?')) return
    setActionBusy(true)
    const response = await fetch(`/api/feed/${post.id}`, { method: 'DELETE' })
    setActionBusy(false)
    if (!response.ok) {
      toast({ title: 'Could not delete post.', variant: 'destructive' })
      return
    }
    queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() })
  }

  const reportPost = async () => {
    const reason = window.prompt('Why are you reporting this post?')
    if (!reason?.trim()) return
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'post', targetId: post.id, reason: reason.trim() }),
    })
    toast({
      title: response.ok ? 'Report sent to community administrators.' : 'Could not send report.',
      variant: response.ok ? 'default' : 'destructive',
    })
  }

  const blockAuthor = async () => {
    if (!window.confirm(`Block ${post.userName}?`)) return
    const response = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: post.userId }),
    })
    toast({
      title: response.ok ? `${post.userName} was blocked.` : 'Could not update block.',
      variant: response.ok ? 'default' : 'destructive',
    })
  }

  const talkInPrivate = () => {
    startConversation.mutate(
      {
        recipientId: post.userId,
        postId: post.id,
        openingMessage: `Hi ${post.userName}, I wanted to discuss your post: "${post.title}"`,
      },
      {
        onSuccess: (data) => navigate(`/messages/${data.conversation.id}`),
        onError: (error: any) => {
          toast({
            title: 'Could not start private chat',
            description: error?.message ?? 'Please try again.',
            variant: 'destructive',
          })
        },
      },
    )
  }

  return (
    <article className="feed-card-enter delight-hover-lift relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/25">
      {post.isPinned && (
        <div className="flex items-center gap-1.5 border-b border-border/50 bg-primary/10 px-4 py-2">
          <Pin size={13} className="text-primary" />
          <span className="text-xs font-bold text-primary">Pinned post</span>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <ResidentAvatar name={post.userName} avatarUrl={post.avatarUrl} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-bold text-foreground">{post.userName}</span>
                <span className="text-xs text-muted-foreground">{post.unitNumber}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
              </div>
              <span className={cn('mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ring-1', badge.className)}>
                <BadgeIcon size={12} />
                {badge.label}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PublicationToggle sourceType="post" sourceId={post.id} variant="icon" />
            {isOwner ? (
              <button type="button" aria-label="Delete post" disabled={actionBusy} onClick={deleteOwnPost} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
                <Trash2 size={15} />
              </button>
            ) : (
              <>
                <button type="button" aria-label="Report post" onClick={reportPost} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <Flag size={15} />
                </button>
                <button type="button" aria-label="Block member" onClick={blockAuthor} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <UserX size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h3 className="mb-1 break-words text-base font-bold leading-snug text-foreground">{post.title}</h3>
          <p className="break-words text-sm leading-relaxed text-foreground/80">{post.body}</p>
        </div>

        <PostImageGallery urls={post.imageUrls} title={post.title || 'Post photo'} />

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <button
            onClick={handleLike}
            className={cn(
              'flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition-colors',
              liked ? 'bg-red-500/10 text-red-600' : 'text-muted-foreground hover:bg-secondary hover:text-red-600'
            )}
          >
            <Heart size={18} className={liked ? 'fill-current' : ''} />
            <span>{post.likesCount + (liked ? 1 : 0)}</span>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <MessageSquare size={18} />
            <span>{post.commentsCount}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {!isOwner && (
            <button
              onClick={talkInPrivate}
              disabled={startConversation.isPending}
              className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-50"
            >
              {startConversation.isPending ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
              <span>Talk in private</span>
            </button>
          )}
        </div>

        {expanded && <CommentSection postId={post.id} />}
      </div>
    </article>
  )
}

function CreatePostModal({ onClose, initialType = 'general' }: { onClose: () => void; initialType?: PostType }) {
  const [type, setType] = useState<PostType>(initialType)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [images, setImages] = useState<ImageAsset[]>([])
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: currentUser } = useCurrentUser()

  const [isUploading, setIsUploading] = useState(false)

  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() })
        onClose()
      },
      onError: (error: any) => {
        toast({
          title: 'Could not post',
          description: error?.message ?? 'Please try again.',
          variant: 'destructive',
        })
      },
    },
  })

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return
    const uploadedUrls = imageUrls(images)
    createPost.mutate({
      data: { type, title: title.trim(), body: body.trim(), imageUrls: uploadedUrls, imageMeta: images, isPinned: false },
    })
  }

  const isComplaint = type === 'complaint'
  const maxImages = type === 'announcement' ? 1 : 4

  return (
    <div data-mobile-composer role="dialog" aria-modal="true" aria-label={isComplaint ? 'File a community report' : 'Create a community post'} className="fixed inset-0 z-[80] flex items-stretch justify-center overflow-hidden bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-[100dvh] max-h-[100dvh] w-full max-w-xl flex-col overflow-hidden border-0 bg-card shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-xl sm:border sm:border-border">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{isComplaint ? 'File Report' : 'Create Post'}</h2>
            <p className="text-sm text-muted-foreground">{isComplaint ? 'Send a neighborhood issue to the right people.' : 'Share an update with your community.'}</p>
          </div>
          <button onClick={onClose} aria-label="Close composer" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-6 sm:p-5">
          <div className="flex items-center gap-3">
            <ResidentAvatar name={currentUser?.name ?? 'Resident'} avatarUrl={currentUser?.avatarUrl} />
            <div>
              <p className="font-semibold text-sm text-foreground">{currentUser?.name ?? 'Resident'}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.unitNumber || 'No unit set'} - Mohalla Community</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Category</label>
            <PostTypeSelector value={type} onChange={setType} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
              {isComplaint ? 'Report Title' : 'Title'}
            </label>
            <input
              type="text"
              placeholder={isComplaint ? 'What needs attention?' : "What's this about?"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
              {isComplaint ? 'Details' : 'Message'}
            </label>
            <textarea
              placeholder={isComplaint ? 'Describe the issue, location, and when it happens...' : 'Share something with your neighbors...'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none"
            />
          </div>

          <ImageUploader
            value={images}
            onChange={setImages}
            maxImages={maxImages}
            label={isComplaint ? 'Attach proof (optional)' : 'Photos'}
            onUploadingChange={setIsUploading}
          />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-muted/20 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-4">
          <Button variant="ghost" onClick={onClose} className="rounded-lg">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || createPost.isPending || isUploading}
            className={cn('rounded-lg text-primary-foreground', isComplaint ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover')}
          >
            {createPost.isPending ? 'Posting...' : isComplaint ? 'Submit Report' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Feed() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [initialPostType, setInitialPostType] = useState<PostType>('general')
  const queryClient = useQueryClient()
  const search = useSearch()

  useEffect(() => {
    const params = new URLSearchParams(search)
    if (params.get('compose') === '1') {
      const type = (params.get('type') as PostType) || 'general'
      setInitialPostType(type)
      setShowCreate(true)
      // Clean URL without triggering a navigation
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [search])

  useEffect(() => {
    const openComposer = () => {
      setInitialPostType('general')
      setShowCreate(true)
    }

    window.addEventListener('mohalla:create-post', openComposer)
    return () => window.removeEventListener('mohalla:create-post', openComposer)
  }, [])

  const { data, isLoading, isFetching } = useListPosts({
    communityId: 'default',
    category: activeCategory === 'all' ? undefined : activeCategory,
    page,
    limit: 20,
  })

  const toggleLike = useToggleLike({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() }),
    },
  })

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    setPage(1)
  }

  const handleLike = useCallback((postId: number) => {
    toggleLike.mutate({ postId })
  }, [toggleLike])

  const openCreatePost = (type: PostType = 'general') => {
    setInitialPostType(type)
    setShowCreate(true)
  }

  const posts = data?.posts ?? []
  const hasMore = data?.hasMore ?? false

  return (
    <div className="portal-shell flex min-h-dvh bg-background">
      <Sidebar />

      <div className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-3 py-3 backdrop-blur-md sm:px-6">
            <div className="no-scrollbar mx-auto flex w-full max-w-3xl items-center gap-2 overflow-x-auto pb-1 lg:grid lg:max-w-5xl lg:grid-cols-7 lg:overflow-visible lg:pb-0">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={cn(
                      'flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition-all lg:w-full lg:shrink lg:justify-center lg:px-3',
                      activeCategory === cat.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary/60 hover:text-foreground'
                    )}
                  >
                    <Icon size={14} className={activeCategory === cat.value ? '' : cat.color} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mx-auto w-full max-w-3xl p-3 pb-24 sm:p-5">
            <div className="space-y-4">
              <ComplaintBar onCompose={() => openCreatePost('complaint')} />
              <EventWidget />
              <PollWidget />

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <FeedPostSkeleton key={i} />)}
                </div>
              ) : posts.length === 0 ? (
                <CommunityEmptyState kind="feed" action="Create Post" onAction={() => openCreatePost()} />
              ) : (
                <>
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post as any} onLike={handleLike} />
                  ))}

                  {hasMore && (
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      className="w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      {isFetching ? 'Loading...' : 'Load more posts'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <button
        onClick={() => openCreatePost()}
        aria-label="Create post"
        className="delight-breathe fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary-hover md:hidden"
      >
        <Plus size={24} />
      </button>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} initialType={initialPostType} />}
    </div>
  )
}
