import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { Button } from '@/components/ui/button'
import { InviteTools } from '@/components/community/invite-tools'
import { cn } from '@/lib/utils'
import {
  MessageSquare, Heart, ShieldAlert, Megaphone, ShoppingBag, UserCheck,
  Lock, Trash2, ChevronRight, Loader2, Check, Bell,
} from 'lucide-react'

type Prefs = {
  notifyComments: boolean; notifyLikes: boolean; notifySafety: boolean;
  notifyAnnouncements: boolean; notifyMarketplace: boolean; notifyApprovals: boolean;
}

const PREF_OPTIONS: { key: keyof Prefs; icon: React.ElementType; label: string; description: string }[] = [
  { key: 'notifyComments',      icon: MessageSquare, label: 'Comments on my posts',    description: 'When someone replies to one of your posts' },
  { key: 'notifyLikes',         icon: Heart,         label: 'Likes on my posts',        description: 'When someone likes your post' },
  { key: 'notifySafety',        icon: ShieldAlert,   label: 'Safety alerts',            description: 'High and medium severity community safety reports' },
  { key: 'notifyAnnouncements', icon: Megaphone,     label: 'Community announcements',  description: 'Official pinned posts from community admin' },
  { key: 'notifyMarketplace',   icon: ShoppingBag,   label: 'Marketplace messages',     description: 'Interest in your listings and buy & sell activity' },
  { key: 'notifyApprovals',     icon: UserCheck,     label: 'Membership approvals',     description: 'When your community membership request is approved' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none',
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const [prefs, setPrefs]       = useState<Prefs | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    fetch('/api/settings/notifications?userId=ahmed')
      .then(r => r.json())
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const update = async (key: keyof Prefs, value: boolean) => {
    if (!prefs) return
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    setSaving(true)
    try {
      await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'ahmed', ...updated }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your preferences and account</p>
              </div>
              {(saving || saved) && (
                <span className={cn('flex items-center gap-1.5 text-sm font-medium transition-all', saved ? 'text-green-600' : 'text-muted-foreground')}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Saving…' : 'Saved'}
                </span>
              )}
            </div>

            {/* Notification Preferences */}
            <Section title="Notification Preferences">
              <div className="px-1">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-3.5 w-40 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-56 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="h-6 w-11 bg-muted rounded-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : prefs ? (
                  PREF_OPTIONS.map((opt, i) => {
                    const Icon = opt.icon
                    return (
                      <div key={opt.key} className={cn(
                        'flex items-center justify-between px-5 py-4 gap-4',
                        i < PREF_OPTIONS.length - 1 && 'border-b border-border'
                      )}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground mt-0.5">
                            <Icon size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                          </div>
                        </div>
                        <Toggle checked={prefs[opt.key]} onChange={(v) => update(opt.key, v)} />
                      </div>
                    )
                  })
                ) : (
                  <p className="p-5 text-sm text-muted-foreground">Failed to load preferences.</p>
                )}
              </div>
            </Section>

            {/* Account Security */}
            <Section title="Account Security">
              <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                    <Lock size={15} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Change Password</p>
                    <p className="text-xs text-muted-foreground">Update your account password</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
              <div className="px-5 py-3 bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Password management will be available once authentication is set up.
                  Currently running in demo mode with a shared community account.
                </p>
              </div>
            </Section>

            {/* Profile Quick Link */}
            <Section title="Your Profile">
              <a href="/profile/ahmed" className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 text-white font-bold text-sm">
                    AK
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ahmed Khan</p>
                    <p className="text-xs text-muted-foreground">B-204 · View and edit your profile</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </a>
            </Section>

            <Section title="Invite Neighbors">
              <div className="p-5">
                <InviteTools
                  communityName="Mohalla Community"
                  area="DHA Phase 5"
                  city="Karachi"
                  title="Invite to Your Community"
                  description="Generate a shareable invite link or open a ready-made WhatsApp invitation."
                />
              </div>
            </Section>

            {/* Danger Zone */}
            <Section title="Danger Zone">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Permanently delete your account and all your data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDelete(true)}
                    className="shrink-0 rounded-xl border-destructive/50 text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 size={13} className="mr-1.5" /> Delete
                  </Button>
                </div>
              </div>
            </Section>

            {/* App info */}
            <div className="text-center text-xs text-muted-foreground/60 pb-4">
              <p>Mohalla Community Hub · v1.0</p>
              <p className="mt-0.5">Made with ❤️ for your neighbourhood</p>
            </div>
          </div>
        </main>
      </div>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
              <Trash2 size={22} className="text-destructive" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Delete your account?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This will permanently remove your profile, posts, and listings. This cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowDelete(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={() => setShowDelete(false)} className="flex-1 rounded-xl">
                Delete Account
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3 text-center">
              Account deletion requires authentication to be enabled.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
