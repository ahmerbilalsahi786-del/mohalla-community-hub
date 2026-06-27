import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  PlayCircle,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setDemoToken, setToken } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { inviteRegisterPath, requestMemberJoin } from '@/lib/member-join'

export default function Login() {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const joinParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const joinCommunityId = joinParams.get('join')?.trim() ?? ''
  const invitedCommunityName = joinParams.get('community')?.trim() ?? ''
  const hasMemberInvite = joinCommunityId.length > 0
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<"member" | "admin">("member")
  const [resetting, setResetting] = useState(false)

  const enterDemo = () => {
    setDemoToken()
    navigate('/dashboard')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim().toLowerCase() === 'demo@mohalla.app' || email.trim().toLowerCase() === 'ahmed@mohalla.app') {
      enterDemo()
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.session?.access_token) {
        toast({ title: error?.message || 'Login failed', variant: 'destructive' })
        return
      }

      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
      const isPlatformOwner = roles?.some((row: { role: string }) => row.role === "super_admin")

      if (accountType === "admin") {
        const { data: canManageOwnCommunity, error: managerError } = await (supabase as any).rpc("can_manage_own_community")
        if (!isPlatformOwner && managerError) {
          await supabase.auth.signOut()
          queryClient.clear()
          toast({ title: "Could not verify administrator access.", variant: "destructive" })
          return
        }
        const canManage =
          isPlatformOwner ||
          (canManageOwnCommunity === true &&
            roles?.some((row: { role: string }) => row.role === "admin" || row.role === "moderator"))
        if (roleError || !canManage) {
          await supabase.auth.signOut()
          queryClient.clear()
          toast({ title: "This account does not have administrator access.", variant: "destructive" })
          return
        }
      }

      setToken(data.session.access_token)
      queryClient.clear()

      if (hasMemberInvite && accountType === "member") {
        try {
          await requestMemberJoin(joinCommunityId)
          toast({
            title: 'Join request submitted',
            description: 'Your community administrator can now review your request.',
          })
          navigate("/pending-approval")
          return
        } catch (joinError) {
          toast({
            title: 'Could not submit join request',
            description: joinError instanceof Error ? joinError.message : 'Please ask the admin for a fresh invite link.',
            variant: 'destructive',
          })
        }
      }

      navigate(isPlatformOwner ? "/super-admin/dashboard" : accountType === "admin" ? "/admin" : "/dashboard")
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Cannot connect to Supabase. Check your project keys.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const sendPasswordReset = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email address first.", variant: "destructive" })
      return
    }
    setResetting(true)
    const error = new Error("Password reset emails are temporarily disabled.")
    setResetting(false)
    toast({
      title: error.message,
      variant: "destructive",
    })
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-accent/25 via-background to-background">
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="mb-12 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground shadow-lg shadow-primary/20">
              م
            </span>
            <span className="font-headings text-2xl font-black text-foreground">Mohalla</span>
          </Link>

          <div className="max-w-xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Neighborhood Access
            </div>
            <div>
              <h1 className="font-headings text-5xl font-black leading-[1.08] text-foreground">
                Step back into your community hub.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Sign in as a resident or administrator to manage posts, approvals, marketplace listings, contacts, and trusted neighborhood updates.
              </p>
            </div>

            <div className="grid max-w-lg grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-white/75 p-4 shadow-sm backdrop-blur">
                <Users className="mb-3 h-5 w-5 text-primary" />
                <div className="text-2xl font-black text-foreground">Verified</div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Residents only after approval</p>
              </div>
              <div className="rounded-2xl border border-border bg-white/75 p-4 shadow-sm backdrop-blur">
                <Building2 className="mb-3 h-5 w-5 text-accent" />
                <div className="text-2xl font-black text-foreground">Private</div>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Built around your society</p>
              </div>
            </div>

            <div className="glass max-w-lg rounded-3xl p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-foreground">Admin/member mode is protected</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Members stay in the resident app. Admin access is checked before the admin panel opens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-7 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground">
                م
              </span>
              <span className="font-headings text-2xl font-black text-foreground">Mohalla</span>
            </Link>
          </div>

          <div className="rounded-[2rem] border border-border bg-white/90 p-5 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-7">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="h-7 w-7" />
              </div>
              <h2 className="font-headings text-3xl font-black text-foreground">Welcome Back</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {hasMemberInvite
                  ? `Sign in to request access${invitedCommunityName ? ` to ${invitedCommunityName}` : ''}.`
                  : 'Choose your access type and continue.'}
              </p>
            </div>

            <button
              type="button"
              onClick={enterDemo}
              className="mb-5 w-full rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/10"
            >
              <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary">
                <PlayCircle size={16} />
                Demo Mode
              </p>
              <p className="text-sm font-black text-foreground">Continue as Ahmed Khan</p>
              <p className="mt-1 text-xs text-muted-foreground">No signup or password needed for previewing the app.</p>
            </button>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-muted/50 p-1.5" aria-label="Account type">
                <button
                  type="button"
                  onClick={() => setAccountType("member")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-all ${
                    accountType === "member" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User size={15} /> Member
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("admin")}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition-all ${
                    accountType === "admin" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldCheck size={15} /> Admin
                </button>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-bold text-foreground">Email</label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-12 rounded-2xl bg-white px-4"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-bold text-foreground">Password</label>
                  <button type="button" disabled={resetting} onClick={sendPasswordReset} className="text-xs font-bold text-primary hover:underline">
                    {resetting ? "Sending..." : "Forgot password?"}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-12 rounded-2xl bg-white px-4 pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="h-12 w-full rounded-2xl font-black shadow-lg shadow-primary/20">
                {loading ? 'Signing in...' : <><LogIn size={17} /> Sign in as {accountType === "admin" ? "Admin" : "Member"}</>}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-5 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href={hasMemberInvite ? inviteRegisterPath(joinCommunityId, invitedCommunityName) : "/register"} className="inline-flex items-center gap-1 font-black text-primary hover:underline">
                  Register <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
