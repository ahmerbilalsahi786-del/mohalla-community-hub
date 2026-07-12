import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { Button } from '@/components/ui/button'
import { InviteTools } from '@/components/community/invite-tools'
import { cn } from '@/lib/utils'
import { useCurrentUser, useLogout } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { getUser } from '@/lib/auth'
import {
  disableMobilePushNotifications,
  enableMobilePushNotifications,
  getMobilePushState,
  type MobilePushState,
  type MobilePushStatus,
} from '@/lib/mobile-push'
import { supabase } from '@/integrations/supabase/client'
import {
  CalendarDays, MessageSquare, Heart, ShieldAlert, Megaphone, ShoppingBag, UserCheck,
  Lock, Trash2, ChevronRight, Loader2, Check, Download, Eye, EyeOff, BellOff, BellRing, Smartphone,
} from 'lucide-react'

type Prefs = {
  notifyComments: boolean; notifyLikes: boolean; notifySafety: boolean;
  notifyAnnouncements: boolean; notifyMarketplace: boolean; notifyApprovals: boolean;
  notifyEvents: boolean; notifyMessages: boolean; notifyTexts: boolean;
}

const PREF_OPTIONS: { key: keyof Prefs; icon: React.ElementType; label: string; description: string }[] = [
  { key: 'notifyComments',      icon: MessageSquare, label: 'Comments on my posts',    description: 'When someone replies to one of your posts' },
  { key: 'notifyLikes',         icon: Heart,         label: 'Likes on my posts',        description: 'When someone likes your post' },
  { key: 'notifySafety',        icon: ShieldAlert,   label: 'Safety alerts',            description: 'High and medium severity community safety reports' },
  { key: 'notifyEvents',        icon: CalendarDays,  label: 'Community events',         description: 'New events published for your society' },
  { key: 'notifyMessages',      icon: MessageSquare, label: 'Private messages',         description: 'When a neighbour sends you a direct message' },
  { key: 'notifyTexts',         icon: MessageSquare, label: 'Text messages',             description: 'Allow important community updates by SMS/text' },
  { key: 'notifyAnnouncements', icon: Megaphone,     label: 'Community announcements',  description: 'Official pinned posts from community admin' },
  { key: 'notifyMarketplace',   icon: ShoppingBag,   label: 'Marketplace messages',     description: 'Interest in your listings and buy & sell activity' },
  { key: 'notifyApprovals',     icon: UserCheck,     label: 'Membership approvals',     description: 'When your community membership request is approved' },
]

const PUSH_STATUS_LABELS: Record<MobilePushStatus, string> = {
  unsupported: "This browser does not support device notifications.",
  "missing-key": "Device notifications are not configured for this build.",
  blocked: "Device notifications are blocked in this browser.",
  prompt: "This device is not enabled yet.",
  disabled: "Notifications are allowed, but this device is not enabled yet.",
  enabled: "This device is enabled for community alerts and private messages.",
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Toggle notification preference"
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
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [accountBusy, setAccountBusy] = useState(false)
  const [pushState, setPushState] = useState<MobilePushState | null>(null)
  const [pushBusy, setPushBusy] = useState(false)
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const { toast } = useToast()
  const demo = getUser()?.userId === "ahmed" && getUser()?.email === "demo@mohalla.app"

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(r => r.json())
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getMobilePushState()
      .then(setPushState)
      .catch(() => setPushState({ status: "unsupported", permission: "unsupported", subscribed: false }))
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
        body: JSON.stringify(updated),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  const enableDeviceNotifications = async () => {
    setPushBusy(true)
    try {
      const state = await enableMobilePushNotifications()
      setPushState(state)
      if (state.status === "enabled") {
        toast({ title: "Device notifications enabled." })
      } else if (state.status === "blocked") {
        toast({ title: "Notifications are blocked in this browser.", variant: "destructive" })
      } else if (state.status === "unsupported") {
        toast({ title: "This browser does not support device notifications.", variant: "destructive" })
      } else {
        toast({ title: "Device notifications were not enabled." })
      }
    } catch (error) {
      toast({
        title: "Could not enable device notifications.",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setPushBusy(false)
    }
  }

  const disableDeviceNotifications = async () => {
    setPushBusy(true)
    try {
      const state = await disableMobilePushNotifications()
      setPushState(state)
      toast({ title: "Device notifications turned off." })
    } catch (error) {
      toast({
        title: "Could not turn off device notifications.",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setPushBusy(false)
    }
  }

  const changePassword = async () => {
    if (demo) {
      toast({ title: "Demo password changes are disabled." })
      setShowPassword(false)
      return
    }
    if (newPassword.length < 12) {
      toast({ title: "Use at least 12 characters.", variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match.", variant: "destructive" })
      return
    }
    setAccountBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setAccountBusy(false)
    if (error) {
      toast({ title: error.message, variant: "destructive" })
      return
    }
    setShowPassword(false)
    setNewPassword("")
    setConfirmPassword("")
    toast({ title: "Password updated." })
  }

  const exportAccountData = async () => {
    if (demo) {
      const blob = new Blob([JSON.stringify({ mode: "demo", user }, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = "mohalla-demo-data.json"
      anchor.click()
      URL.revokeObjectURL(url)
      return
    }

    setAccountBusy(true)
    const userId = user?.userId
    if (!userId) {
      setAccountBusy(false)
      toast({ title: "Sign in again before exporting data.", variant: "destructive" })
      return
    }
    const extendedDb = supabase as any
    const [profile, privateProfile, posts, comments, listings, events, rsvps, votes, preferences] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("private_profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("posts").select("*").eq("user_id", userId),
      supabase.from("comments").select("*").eq("user_id", userId),
      supabase.from("listings").select("*").eq("user_id", userId),
      supabase.from("events").select("*").eq("user_id", userId),
      supabase.from("event_rsvps").select("*").eq("user_id", userId),
      supabase.from("poll_votes").select("*").eq("user_id", userId),
      extendedDb.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle(),
    ])
    setAccountBusy(false)
    const payload = {
      exportedAt: new Date().toISOString(),
      account: user,
      profile: profile.data,
      privateProfile: privateProfile.data,
      posts: posts.data ?? [],
      comments: comments.data ?? [],
      listings: listings.data ?? [],
      events: events.data ?? [],
      eventRsvps: rsvps.data ?? [],
      pollVotes: votes.data ?? [],
      notificationPreferences: preferences.data,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `mohalla-account-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const deleteAccount = async () => {
    if (demo) {
      setShowDelete(false)
      toast({ title: "Demo account deletion is disabled." })
      return
    }
    setAccountBusy(true)
    const { error } = await (supabase as any).rpc("delete_my_account")
    setAccountBusy(false)
    if (error) {
      toast({ title: error.message, variant: "destructive" })
      return
    }
    setShowDelete(false)
    await logout()
  }

  return (
    <div className="portal-shell flex min-h-screen bg-background">
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

            <Section title="Device Notifications">
              <div className="px-5 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                      {pushState?.status === "enabled" ? <BellRing size={18} /> : <Smartphone size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">This device</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {pushState ? PUSH_STATUS_LABELS[pushState.status] : "Checking this device..."}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={pushState?.status === "enabled" ? "outline" : "default"}
                    size="sm"
                    disabled={
                      pushBusy ||
                      !pushState ||
                      pushState.status === "unsupported" ||
                      pushState.status === "missing-key" ||
                      pushState.status === "blocked"
                    }
                    onClick={pushState?.status === "enabled" ? disableDeviceNotifications : enableDeviceNotifications}
                    className="w-full shrink-0 rounded-xl sm:w-auto"
                  >
                    {pushBusy ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : pushState?.status === "enabled" ? (
                      <BellOff size={14} className="mr-1.5" />
                    ) : (
                      <BellRing size={14} className="mr-1.5" />
                    )}
                    {pushState?.status === "enabled" ? "Turn off" : "Enable"}
                  </Button>
                </div>
              </div>
            </Section>

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
              <button type="button" onClick={() => setShowPassword(true)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors border-b border-border">
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
              <button type="button" onClick={exportAccountData} disabled={accountBusy} className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 disabled:opacity-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground"><Download size={15} /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Export My Data</p>
                    <p className="text-xs text-muted-foreground">Download your Mohalla account information</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            </Section>

            {/* Profile Quick Link */}
            <Section title="Your Profile">
              <Link href={`/profile/${user?.userId ?? "me"}`} className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 text-white font-bold text-sm">
                    {(user?.name ?? "R").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user?.name ?? "Resident"}</p>
                    <p className="text-xs text-muted-foreground">{user?.unitNumber || "No unit set"} · View and edit your profile</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            </Section>

            <Section title="Invite Neighbors">
              <div className="p-5">
                <InviteTools
                  communityName={user?.community?.name ?? "Mohalla Community"}
                  communityId={user?.community?.id}
                  area={user?.community?.area ?? "DHA Phase 5"}
                  city={user?.community?.city ?? "Karachi"}
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
              <p className="mt-1"><Link href="/privacy" className="hover:text-primary">Privacy</Link> · <Link href="/terms" className="hover:text-primary">Terms</Link></p>
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
              <Button variant="destructive" disabled={accountBusy} onClick={deleteAccount} className="flex-1 rounded-xl">
                {accountBusy ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3 text-center">
              This action permanently removes the authentication account and linked community data.
            </p>
          </div>
        </div>
      )}

      {showPassword && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-2xl">
            <h3 className="text-lg font-bold">Change password</h3>
            <p className="mt-1 text-sm text-muted-foreground">Use at least 12 characters.</p>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <input type={passwordVisible ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm" />
                <button type="button" aria-label={passwordVisible ? "Hide password" : "Show password"} onClick={() => setPasswordVisible((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {passwordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <input type={passwordVisible ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPassword(false)}>Cancel</Button>
              <Button type="button" className="flex-1" disabled={accountBusy} onClick={changePassword}>{accountBusy ? "Saving..." : "Update"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
