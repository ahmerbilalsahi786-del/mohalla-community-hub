import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Eye, EyeOff, LogIn, PlayCircle, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setDemoToken, setToken } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export default function Login() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<"member" | "admin">("member")
  const [resetting, setResetting] = useState(false)

  const enterDemo = () => {
    setDemoToken()
    navigate('/')
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
        const canManage = roles?.some((row: { role: string }) => row.role === "admin" || row.role === "moderator" || row.role === "super_admin")
        if (roleError || !canManage) {
          await supabase.auth.signOut()
          toast({ title: "This account does not have administrator access.", variant: "destructive" })
          return
        }
      }

      setToken(data.session.access_token)
      navigate(isPlatformOwner ? "/super-admin/dashboard" : accountType === "admin" ? "/admin" : "/")
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
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetting(false)
    toast({
      title: error ? error.message : "Password reset email sent.",
      variant: error ? "destructive" : "default",
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">م</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your Mohalla account</p>
        </div>

        {/* Demo credentials banner */}
        <button
          type="button"
          onClick={enterDemo}
          className="mb-5 w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">Demo Mode</p>
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <PlayCircle size={16} className="text-primary" />
            Continue as Ahmed Khan
          </p>
          <p className="text-xs text-muted-foreground">No signup or password needed for previewing the app.</p>
        </button>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1" aria-label="Account type">
            <button type="button" onClick={() => setAccountType("member")} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${accountType === "member" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <User size={15} /> Member
            </button>
            <button type="button" onClick={() => setAccountType("admin")} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${accountType === "admin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              <ShieldCheck size={15} /> Admin
            </button>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
              <button type="button" disabled={resetting} onClick={sendPasswordReset} className="text-xs font-medium text-primary hover:underline">
                {resetting ? "Sending..." : "Forgot password?"}
              </button>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-primary">
            {loading ? 'Signing in…' : <><LogIn size={16} className="mr-2" /> Sign in as {accountType === "admin" ? "admin" : "member"}</>}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
