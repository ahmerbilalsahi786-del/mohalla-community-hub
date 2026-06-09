import { useState, useCallback, useRef, useEffect } from 'react'
import { useListPosts, useCreatePost, useToggleLike, useListComments, useCreateComment, useListEvents, useListPolls } from '@/lib/generated/api'
import { useQueryClient } from '@tanstack/react-query'
import { getListPostsQueryKey, getListCommentsQueryKey } from '@/lib/generated/api'
import { useUpload } from '@workspace/object-storage-web'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import {
  Pin, Heart, MessageSquare, Plus, X, ChevronDown, ChevronUp,
  Megaphone, Shield, Search, ShoppingBag, Calendar, Users, ImagePlus, Send, Loader2,
  MapPin, Clock, BarChart2, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link, useSearch } from 'wouter'

type PostType = 'general' | 'announcement' | 'safety' | 'lost_found' | 'buy_sell' | 'event'

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
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <Calendar size={14} className="text-primary" />
          Upcoming Event
        </div>
        <Link href="/events" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          All events <ChevronRight size={12} />
        </Link>
      </div>
      <div className="px-4 py-3">
        <p className="font-semibold text-foreground text-sm leading-snug">{next.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(next.date)}{next.time && ` · ${next.time}`}</span>
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/5">
        <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
          <BarChart2 size={14} className="text-accent" />
          Community Poll
        </div>
        <Link href="/polls" className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors">
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
            <p className="text-xs text-muted-foreground">{poll.totalVotes} votes · {timeLeft(poll.endsAt)}</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground mb-2">{poll.options.length} options · {timeLeft(poll.endsAt)}</p>
            <Link href="/polls" className="inline-flex items-center gap-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1.5 text-xs font-semibold transition-colors">
              <BarChart2 size={11} /> Vote now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

const CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'all', label: 'All', icon: Users, color: 'text-foreground' },
  { value: 'announcement', label: 'Announcements', icon: Megaphone, color: 'text-amber-600' },
  { value: 'safety', label: 'Safety', icon: Shield, color: 'text-red-500' },
  { value: 'lost_found', label: 'Lost & Found', icon: Search, color: 'text-blue-500' },
  { value: 'buy_sell', label: 'Buy & Sell', icon: ShoppingBag, color: 'text-green-600' },
  { value: 'event', label: 'Events', icon: Calendar, color: 'text-accent' },
]

const CATEGORY_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  announcement: { label: 'Announcement', bg: 'bg-amber-500/10', text: 'text-amber-700' },
  safety: { label: 'Safety', bg: 'bg-red-500/10', text: 'text-red-600' },
  lost_found: { label: 'Lost & Found', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  buy_sell: { label: 'Buy & Sell', bg: 'bg-green-500/10', text: 'text-green-700' },
  event: { label: 'Event', bg: 'bg-accent/10', text: 'text-accent' },
  general: { label: 'General', bg: 'bg-muted', text: 'text-muted-foreground' },
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

function AvatarInitials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={cn(
      'flex items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 font-bold text-white shrink-0',
      size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
    )}>
      {initials}
    </div>
  )
}

function ImageGrid({ urls }: { urls: string[] }) {
  if (!urls || urls.length === 0) return null
  const count = urls.length
  return (
    <div className={cn(
      'mt-3 grid gap-1.5 rounded-xl overflow-hidden',
      count === 1 ? 'grid-cols-1' : count === 2 ? 'grid-cols-2' : 'grid-cols-2'
    )}>
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className={cn(
          'relative bg-muted overflow-hidden',
          count === 1 ? 'aspect-video' : 'aspect-square',
          count === 3 && i === 0 ? 'row-span-2' : ''
        )}>
          <img src={url} alt="" className="w-full h-full object-cover" />
          {i === 3 && count > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
              +{count - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CommentSection({ postId }: { postId: number }) {
  const [commentBody, setCommentBody] = useState('')
  const { data: comments = [], isLoading } = useListComments(postId)
  const queryClient = useQueryClient()
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
    <div className="mt-4 border-t border-border pt-4 space-y-3">
      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map(i => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-8 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <AvatarInitials name={c.userName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-xl px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">{c.userName}</span>
                    <span className="text-xs text-muted-foreground">{c.unitNumber}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{c.body}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <AvatarInitials name="Ahmed Khan" size="sm" />
        <div className="flex-1 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 text-sm bg-muted/50 rounded-xl px-3 py-2 border border-border focus:outline-none focus:border-primary focus:bg-background transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!commentBody.trim() || createComment.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
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
  const badge = CATEGORY_BADGE[post.type] || CATEGORY_BADGE.general

  const handleLike = () => {
    setLiked(!liked)
    onLike(post.id)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {post.isPinned && (
        <div className="flex items-center gap-1.5 border-b border-border/50 bg-primary/5 px-4 py-2">
          <Pin size={13} className="text-primary" />
          <span className="text-xs font-semibold text-primary">Pinned Post</span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <AvatarInitials name={post.userName} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{post.userName}</span>
                <span className="text-xs text-muted-foreground">{post.unitNumber}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
              </div>
              <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', badge.bg, badge.text)}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
          <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{post.body}</p>
        </div>

        <ImageGrid urls={post.imageUrls} />

        {/* Actions */}
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            )}
          >
            <Heart size={18} className={liked ? 'fill-current' : ''} />
            <span>{post.likesCount + (liked ? 1 : 0)}</span>
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageSquare size={18} />
            <span>{post.commentsCount}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {expanded && <CommentSection postId={post.id} />}
      </div>
    </div>
  )
}

function CreatePostModal({ onClose, initialType = 'general' }: { onClose: () => void; initialType?: PostType }) {
  const [type, setType] = useState<PostType>(initialType)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { uploadFile, isUploading } = useUpload({
    basePath: '/api/storage',
    onError: (err) => setUploadError(err.message),
  })

  const createPost = useCreatePost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() })
        onClose()
      },
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploadError(null)
    const remaining = 4 - imageUrls.length
    const toUpload = files.slice(0, remaining)

    for (const file of toUpload) {
      const result = await uploadFile(file)
      if (result) {
        const servingUrl = `/api/storage${result.objectPath}`
        setImageUrls((prev) => [...prev, servingUrl])
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return
    createPost.mutate({
      data: { type, title: title.trim(), body: body.trim(), imageUrls, isPinned: false },
    })
  }

  const typeOptions: { value: PostType; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'safety', label: 'Safety' },
    { value: 'lost_found', label: 'Lost & Found' },
    { value: 'buy_sell', label: 'Buy & Sell' },
    { value: 'event', label: 'Event' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Create Post</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Author row */}
          <div className="flex items-center gap-3">
            <AvatarInitials name="Ahmed Khan" />
            <div>
              <p className="font-semibold text-sm text-foreground">Ahmed Khan</p>
              <p className="text-xs text-muted-foreground">B-204 · Mohalla Community</p>
            </div>
          </div>

          {/* Category select */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'rounded-xl py-2 px-3 text-sm font-medium border transition-all',
                    type === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
            <input
              type="text"
              placeholder="What's this about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-colors"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Message</label>
            <textarea
              placeholder="Share something with your neighbors..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-colors resize-none"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Photos ({imageUrls.length}/4)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading || imageUrls.length >= 4}
            />

            {imageUrls.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-colors',
                  isUploading
                    ? 'border-primary/40 bg-primary/5 text-primary cursor-not-allowed'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImagePlus size={16} />
                    Add photos from device
                  </>
                )}
              </button>
            )}

            {uploadError && (
              <p className="mt-1.5 text-xs text-destructive">{uploadError}</p>
            )}

            {imageUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                    <button
                      onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || createPost.isPending || isUploading}
            className="rounded-xl bg-primary text-primary-foreground"
          >
            {createPost.isPending ? 'Posting...' : 'Post'}
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

  const posts = data?.posts ?? []
  const hasMore = data?.hasMore ?? false

  return (
    <div className="flex min-h-screen bg-background">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto">
          {/* Category filter */}
          <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-6 py-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all shrink-0',
                      activeCategory === cat.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon size={14} className={activeCategory === cat.value ? '' : cat.color} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6 max-w-2xl mx-auto space-y-4 pb-24">
            <EventWidget />
            <PollWidget />

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-2/3 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <MessageSquare size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-foreground">No posts yet.</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to post something!</p>
                <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl bg-primary text-primary-foreground">
                  <Plus size={16} className="mr-2" />
                  Create Post
                </Button>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post as any} onLike={handleLike} />
                ))}

                {hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    className="w-full rounded-xl border border-border bg-card py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {isFetching ? 'Loading...' : 'Load more posts'}
                  </button>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Floating create button */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} initialType={initialPostType} />}
    </div>
  )
}
