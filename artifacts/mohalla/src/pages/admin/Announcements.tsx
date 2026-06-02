import { useState } from 'react'
import { AdminLayout } from './AdminLayout'
import {
  useAdminCreateAnnouncement, useAdminListPosts,
  getAdminListPostsQueryKey,
} from '@workspace/api-client-react'
import { useQueryClient } from '@tanstack/react-query'
import { Megaphone, Pin, Share2, Copy, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Post = {
  id: number; title: string; body: string; type: string;
  userName: string; createdAt: string; isPinned: boolean;
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

function buildBlastText(title: string, communityName = 'My Mohalla') {
  return `📢 ${communityName} Announcement: ${title}. Open Mohalla for full details.`
}

export default function AdminAnnouncements() {
  const qc = useQueryClient()
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [copied, setCopied] = useState<number | null>(null)

  const { data: allPosts = [] } = useAdminListPosts({ communityId: 'default' })
  const announcements = (allPosts as Post[]).filter(p => p.type === 'announcement')

  const create = useAdminCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminListPostsQueryKey() })
        setTitle('')
        setBody('')
      },
    },
  })

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Announcements</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create official announcements pinned to the top of the feed</p>
        </div>

        {/* Create form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Megaphone size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">New Announcement</h3>
              <p className="text-xs text-muted-foreground">Automatically pinned to the top of the community feed</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
            <input
              type="text"
              placeholder="e.g. Water supply shut off Friday 10AM–2PM"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Full Details</label>
            <textarea
              placeholder="Write the full announcement text here. Residents will see this in the feed."
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* WhatsApp blast preview */}
          {title.trim() && (
            <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4">
              <p className="text-xs font-semibold text-[#128C7E] mb-1.5 flex items-center gap-1.5">
                <Share2 size={12} />
                WhatsApp Blast Message Preview
              </p>
              <p className="text-sm text-foreground font-mono">{buildBlastText(title)}</p>
              <div className="mt-3 flex gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(buildBlastText(title))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#128C7E] transition-colors"
                >
                  <Share2 size={12} />
                  Open WhatsApp
                </a>
                <button
                  onClick={() => handleCopy(0, buildBlastText(title))}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  {copied === 0 ? <CheckCheck size={12} className="text-green-600" /> : <Copy size={12} />}
                  {copied === 0 ? 'Copied!' : 'Copy Message'}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={() => create.mutate({ data: { title: title.trim(), body: body.trim() } })}
              disabled={!title.trim() || !body.trim() || create.isPending}
              className="gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
            >
              {create.isPending ? <Loader2 size={15} className="animate-spin" /> : <Pin size={15} />}
              Publish & Pin Announcement
            </Button>
          </div>
        </div>

        {/* Previous announcements */}
        {announcements.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Previous Announcements ({announcements.length})
            </h3>
            <div className="space-y-3">
              {announcements.map(post => {
                const blastText = buildBlastText(post.title)
                return (
                  <div key={post.id} className="rounded-2xl border border-purple-200/50 bg-purple-500/3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {post.isPinned && <Pin size={12} className="text-primary shrink-0" />}
                          <h4 className="font-semibold text-foreground truncate">{post.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">{post.userName} · {timeAgo(post.createdAt)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(blastText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Re-share on WhatsApp"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#25D366]/10 hover:text-[#25D366] transition-colors"
                        >
                          <Share2 size={14} />
                        </a>
                        <button
                          onClick={() => handleCopy(post.id, blastText)}
                          title="Copy blast message"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                        >
                          {copied === post.id ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
