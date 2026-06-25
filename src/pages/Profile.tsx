import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  User, Edit2, MapPin, Calendar, Phone, MessageSquare, ShoppingBag,
  Heart, Pin, X, Check, Upload, Loader2, ExternalLink, Star, Trophy,
  AlertTriangle, ShieldCheck, TrendingUp, Award,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { uploadImage } from '@/lib/cloudinary'
import { useCurrentUser } from '@/hooks/use-current-user'

const ME = 'ahmed'

type Profile = {
  userId: string; displayName: string; unitNumber: string;
  avatarUrl?: string | null; whatsappNumber?: string | null; createdAt: string;
}
type Post = {
  id: number; title: string; body: string; type: string;
  likesCount: number; commentsCount: number; createdAt: string; isPinned: boolean;
}
type Listing = {
  id: number; title: string; price: number; category: string;
  imageUrl?: string | null; status: string; createdAt: string;
}

type ProfileStat = {
  label: string
  value: string | number
  detail: string
  icon: React.ElementType
  className: string
}

const BADGE: Record<string, { bg: string; text: string }> = {
  announcement: { bg: 'bg-amber-500/10', text: 'text-amber-700' },
  safety:       { bg: 'bg-red-500/10',   text: 'text-red-600' },
  complaint:    { bg: 'bg-red-600/10',   text: 'text-red-700' },
  lost_found:   { bg: 'bg-blue-500/10',  text: 'text-blue-600' },
  buy_sell:     { bg: 'bg-green-500/10', text: 'text-green-700' },
  event:        { bg: 'bg-accent/10',    text: 'text-accent' },
  general:      { bg: 'bg-muted',        text: 'text-muted-foreground' },
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
function initials(name: string) {
  return name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
}
function memberSince(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function StatTile({ stat }: { stat: ProfileStat }) {
  const Icon = stat.icon
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.className)}>
          <Icon size={18} />
        </div>
        <span className="text-2xl font-bold text-foreground">{stat.value}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{stat.label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{stat.detail}</p>
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams<{ id: string }>()
  const requestedUserId = params.id || 'me'
  const { data: currentUser } = useCurrentUser()
  const userId = requestedUserId === 'me' ? currentUser?.userId ?? 'me' : requestedUserId
  const isMe = requestedUserId === 'me' || requestedUserId === ME || requestedUserId === currentUser?.userId
  const [, navigate] = useLocation()

  const [profile, setProfile]   = useState<Profile | null>(null)
  const [posts, setPosts]       = useState<Post[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [tab, setTab]           = useState<'posts' | 'listings'>('posts')
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)

  // Edit state
  const [editName, setEditName]     = useState('')
  const [editUnit, setEditUnit]     = useState('')
  const [editWA, setEditWA]         = useState('')
  const [editAvatar, setEditAvatar] = useState<string | undefined>()
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [uploading, setUploading]   = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(data => {
        setProfile(data.profile)
        setPosts(data.posts)
        setListings(data.listings)
        setEditName(data.profile.displayName || '')
        setEditUnit(data.profile.unitNumber || '')
        setEditWA(data.profile.whatsappNumber || '')
        setEditAvatar(data.profile.avatarUrl ?? undefined)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    try {
      const url = await uploadImage(f)
      if (url) {
        setEditAvatar(url)
      } else {
        toast({
          title: 'Image upload failed',
          description: 'Please try again.',
          variant: 'destructive',
        })
      }
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editName, unitNumber: editUnit, whatsappNumber: editWA, avatarUrl: editAvatar }),
      })
      const updated = await res.json()
      setProfile(updated)
      setSaved(true)
      setTimeout(() => { setSaved(false); setEditing(false) }, 1200)
    } catch {}
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopNavbar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary" />
          </main>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopNavbar />
          <main className="flex-1 flex flex-col items-center justify-center gap-3">
            <User size={40} className="text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">Profile not found</p>
          </main>
        </div>
      </div>
    )
  }

  const displayName = editing ? editName : (profile.displayName || profile.userId)
  const avatarSrc   = editing ? editAvatar : (profile.avatarUrl ?? undefined)
  const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0)
  const totalComments = posts.reduce((sum, post) => sum + post.commentsCount, 0)
  const complaintCount = posts.filter((post) => post.type === 'complaint').length
  const helpfulPosts = posts.filter((post) => ['announcement', 'safety', 'lost_found', 'complaint'].includes(post.type)).length
  const socialScore = Math.min(999, posts.length * 12 + listings.length * 8 + totalLikes * 3 + totalComments * 2 + helpfulPosts * 10)
  const responseRate = posts.length ? Math.min(100, Math.round((totalComments / Math.max(posts.length, 1)) * 18 + 52)) : 0
  const profileStats: ProfileStat[] = [
    { label: 'Social Score', value: socialScore, detail: 'from posts, likes, comments', icon: Trophy, className: 'bg-amber-500/10 text-amber-700' },
    { label: 'Total Posts', value: posts.length, detail: `${complaintCount} complaint${complaintCount === 1 ? '' : 's'} filed`, icon: MessageSquare, className: 'bg-primary/10 text-primary' },
    { label: 'Helpfulness', value: helpfulPosts, detail: 'alerts, findings, announcements', icon: ShieldCheck, className: 'bg-green-500/10 text-green-700' },
    { label: 'Engagement', value: totalLikes + totalComments, detail: `${totalLikes} likes, ${totalComments} comments`, icon: TrendingUp, className: 'bg-blue-500/10 text-blue-700' },
    { label: 'Listings', value: listings.length, detail: 'marketplace contributions', icon: ShoppingBag, className: 'bg-purple-500/10 text-purple-700' },
    { label: 'Response Rate', value: `${responseRate}%`, detail: posts.length ? 'estimated neighbor activity' : 'starts after first post', icon: Star, className: 'bg-pink-500/10 text-pink-700' },
  ]
  const profileOptions = [
    { label: 'Badges', value: isMe ? 'Verified resident' : 'Community resident', icon: Award },
    { label: 'Complaints', value: `${complaintCount} submitted`, icon: AlertTriangle },
    { label: 'Reach', value: `${totalLikes + totalComments} interactions`, icon: Heart },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Profile Card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Cover */}
              <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10" />

              <div className="px-6 pb-6">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl border-4 border-card overflow-hidden bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center shadow-lg">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white">{initials(displayName || profile.userId)}</span>
                      )}
                    </div>
                    {editing && (
                      <label className={cn(
                        'absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white cursor-pointer shadow hover:bg-primary/90 transition-colors',
                        uploading && 'opacity-60 pointer-events-none'
                      )}>
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                      </label>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {isMe && !editing && (
                      <Button onClick={() => setEditing(true)} variant="outline" size="sm" className="rounded-xl gap-1.5">
                        <Edit2 size={13} /> Edit Profile
                      </Button>
                    )}
                    {editing && (
                      <>
                        <Button onClick={() => setEditing(false)} variant="ghost" size="sm" className="rounded-xl gap-1.5">
                          <X size={13} /> Cancel
                        </Button>
                        <Button onClick={saveProfile} disabled={saving || saved} size="sm" className="rounded-xl gap-1.5">
                          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Check size={13} />}
                          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
                        </Button>
                      </>
                    )}
                    {!isMe && profile.whatsappNumber && (
                      <a
                        href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g,'')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 transition-colors"
                      >
                        <Phone size={12} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* Name & info */}
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Display Name</label>
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Unit Number</label>
                        <input type="text" value={editUnit} onChange={e => setEditUnit(e.target.value)}
                          placeholder="e.g. B-204"
                          className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">WhatsApp Number</label>
                        <input type="tel" value={editWA} onChange={e => setEditWA(e.target.value)}
                          placeholder="e.g. 03001234567"
                          className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-foreground">{profile.displayName || profile.userId}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {profile.unitNumber && (
                        <span className="flex items-center gap-1"><MapPin size={13} />{profile.unitNumber}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />Member since {memberSince(profile.createdAt)}
                      </span>
                      {profile.whatsappNumber && (
                        <span className="flex items-center gap-1"><Phone size={13} />{profile.whatsappNumber}</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="font-semibold text-foreground">{posts.length} <span className="font-normal text-muted-foreground">posts</span></span>
                      <span className="font-semibold text-foreground">{listings.length} <span className="font-normal text-muted-foreground">listings</span></span>
                      <span className="font-semibold text-foreground">{socialScore} <span className="font-normal text-muted-foreground">score</span></span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profileStats.map((stat) => (
                <StatTile key={stat.label} stat={stat} />
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Profile Options</h3>
                {isMe && (
                  <Button onClick={() => navigate('/settings')} variant="outline" size="sm" className="rounded-xl">
                    Settings
                  </Button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {profileOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <div key={option.label} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{option.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{option.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
              <button
                onClick={() => setTab('posts')}
                className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === 'posts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
              >
                <MessageSquare size={14} /> Posts ({posts.length})
              </button>
              <button
                onClick={() => setTab('listings')}
                className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  tab === 'listings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
              >
                <ShoppingBag size={14} /> Listings ({listings.length})
              </button>
            </div>

            {/* Posts tab */}
            {tab === 'posts' && (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border text-center">
                    <MessageSquare size={28} className="text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No posts yet</p>
                  </div>
                ) : posts.map(p => (
                  <div key={p.id} className="rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {p.isPinned && <Pin size={12} className="text-primary" />}
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', (BADGE[p.type] ?? BADGE.general).bg, (BADGE[p.type] ?? BADGE.general).text)}>
                            {p.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm">{p.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.body}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(p.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart size={11} />{p.likesCount}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={11} />{p.commentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Listings tab */}
            {tab === 'listings' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {listings.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border text-center">
                    <ShoppingBag size={28} className="text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">No listings yet</p>
                  </div>
                ) : listings.map(l => (
                  <div key={l.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow">
                    {l.imageUrl && <img src={l.imageUrl} alt={l.title} className="h-32 w-full object-cover" />}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-foreground text-sm line-clamp-1">{l.title}</h4>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                          l.status === 'sold' ? 'bg-muted text-muted-foreground' : 'bg-green-500/10 text-green-700')}>
                          {l.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-primary mt-1">PKR {Number(l.price).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{l.category} · {timeAgo(l.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
