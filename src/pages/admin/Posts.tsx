import { AdminLayout } from './AdminLayout'
import {
  useAdminListPosts, useAdminDeletePost, useAdminTogglePin,
  getAdminListPostsQueryKey,
} from '@/lib/generated/api'
import { useQueryClient } from '@tanstack/react-query'
import { Pin, PinOff, Trash2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

type Post = {
  id: number; title: string; body: string; type: string; userName: string;
  unitNumber: string; isPinned: boolean; likesCount: number; commentsCount: number; createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  announcement: 'bg-purple-500/10 text-purple-700',
  emergency:    'bg-red-500/10 text-red-600',
  event:        'bg-blue-500/10 text-blue-700',
  general:      'bg-muted text-muted-foreground',
  maintenance:  'bg-amber-500/10 text-amber-700',
  sale:         'bg-green-500/10 text-green-700',
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function AdminPosts() {
  const qc = useQueryClient()
  const inv = () => qc.invalidateQueries({ queryKey: getAdminListPostsQueryKey() })

  const { data: posts = [], isLoading } = useAdminListPosts({ communityId: 'default' })
  const del     = useAdminDeletePost({ mutation: { onSuccess: inv } })
  const pin     = useAdminTogglePin({ mutation: { onSuccess: inv } })

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground">Posts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(posts as Post[]).length} total · {(posts as Post[]).filter(p => p.isPinned).length} pinned
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : (posts as Post[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <FileText size={24} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Post</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Author</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Engagement</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Posted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(posts as Post[]).map(post => (
                    <tr key={post.id} className={cn('border-b border-border hover:bg-muted/20 transition-colors', post.isPinned && 'bg-primary/3')}>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-start gap-2">
                          {post.isPinned && <Pin size={13} className="text-primary shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-1">{post.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.body}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{post.userName}</p>
                        <p className="text-xs text-muted-foreground">{post.unitNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', TYPE_COLORS[post.type] || TYPE_COLORS.general)}>
                          {post.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        ♥ {post.likesCount} · 💬 {post.commentsCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{timeAgo(post.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => pin.mutate({ postId: post.id })}
                            title={post.isPinned ? 'Unpin' : 'Pin to top of feed'}
                            className={cn(
                              'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                              post.isPinned
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                          >
                            {post.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                            {post.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this post?')) del.mutate({ postId: post.id }) }}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
