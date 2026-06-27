import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Building2, Eye, EyeOff, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setToken } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { inviteLoginPath, requestMemberJoin } from '@/lib/member-join'

function emailRedirectTo() {
  const configuredUrl = import.meta.env.VITE_APP_URL?.trim()
  const origin = configuredUrl || window.location.origin

  return `${origin.replace(/\/$/, '')}/login`
}

export default function Register() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const joinParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const joinCommunityId = joinParams.get('join')?.trim() ?? ''
  const invitedCommunityName = joinParams.get('community')?.trim() ?? ''
  const isMemberInvite = joinCommunityId.length > 0
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userId: '',
    name: '',
    unitNumber: '',
    communityName: '',
    communityArea: '',
    communityCity: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const requestInviteForSignedInMember = async () => {
    await requestMemberJoin(joinCommunityId, {
      username: form.userId,
      fullName: form.name,
      unitNumber: form.unitNumber,
    })
    toast({
      title: 'Join request submitted',
      description: 'Your community administrator can now review your request.',
    })
    navigate('/pending-approval')
  }

  const signInExistingInviteMember = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error || !data.session?.access_token) {
      toast({
        title: 'Account already exists',
        description: 'Sign in with this account to request joining this community.',
        variant: 'destructive',
      })
      navigate(inviteLoginPath(joinCommunityId, invitedCommunityName))
      return true
    }

    setToken(data.session.access_token)
    await requestInviteForSignedInMember()
    return true
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const nextErrors: Record<string, string[]> = {}
      if (!/^[a-z0-9_-]+$/.test(form.userId)) {
        nextErrors.userId = ['Use lowercase letters, numbers, - and _ only']
      }
      if (form.password.length < 12) {
        nextErrors.password = ['Password must be at least 12 characters']
      }
      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = ['Passwords do not match']
      }
      if (!isMemberInvite && !form.communityName.trim()) {
        nextErrors.communityName = ['Society name is required']
      }
      if (!isMemberInvite && !form.communityCity.trim()) {
        nextErrors.communityCity = ['City is required']
      }
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors)
        return
      }

      const registrationData = isMemberInvite
        ? {
            username: form.userId,
            full_name: form.name,
            name: form.name,
            unit_number: form.unitNumber,
            registration_type: 'member',
            join_community_id: joinCommunityId,
          }
        : {
            username: form.userId,
            full_name: form.name,
            name: form.name,
            unit_number: form.unitNumber,
            registration_type: 'community_admin',
            community_name: form.communityName,
            community_area: form.communityArea,
            community_city: form.communityCity,
          }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: emailRedirectTo(),
          data: registrationData,
        },
      })

      if (error) {
        const message = error.message?.toLowerCase() ?? ''
        if (isMemberInvite && (message.includes('already registered') || message.includes('already exists'))) {
          await signInExistingInviteMember()
          return
        }
        toast({ title: error.message || 'Registration failed', variant: 'destructive' })
        return
      }

      if (data.session?.access_token) {
        setToken(data.session.access_token)
        if (isMemberInvite) {
          await requestInviteForSignedInMember()
          return
        }
        navigate('/pending-approval')
        return
      }

      if (isMemberInvite && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        await signInExistingInviteMember()
        return
      }

      toast({
        title: isMemberInvite
          ? 'Join request created. Sign in to continue.'
          : 'Account created. Sign in to continue.',
      })
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Cannot connect to Supabase. Check your project keys.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        type={type === 'password' ? (showPw ? 'text' : 'password') : type}
        value={(form as any)[key]}
        onChange={set(key)}
        placeholder={placeholder}
        required
        className="rounded-xl"
      />
      {errors[key] && <p className="text-xs text-destructive">{errors[key][0]}</p>}
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">م</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isMemberInvite ? `Join ${invitedCommunityName || 'this Mohalla'}` : 'Join your Mohalla'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isMemberInvite ? 'Create your resident account for admin approval' : 'Register your society for approval'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isMemberInvite ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Users size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Resident join request</p>
                  <p className="text-xs text-muted-foreground">{invitedCommunityName || 'Invited community'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 size={16} className="text-primary" />
                Society details
              </div>
              <div className="space-y-3">
                {field('communityName', 'Society name', 'text', 'DHA Phase 5 Residents')}
                {field('communityArea', 'Area', 'text', 'DHA Phase 5')}
                {field('communityCity', 'City', 'text', 'Karachi')}
              </div>
            </div>
          )}

          {field('name', 'Full name', 'text', 'Ahmed Khan')}
          {field('email', 'Email', 'email', 'you@example.com')}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Username</label>
            <Input
              type="text"
              value={form.userId}
              onChange={set('userId')}
              placeholder="ahmed (lowercase, no spaces)"
              required
              pattern="[a-z0-9_-]+"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Lowercase letters, numbers, - and _ only</p>
            {errors.userId && <p className="text-xs text-destructive">{errors.userId[0]}</p>}
          </div>

          {field('unitNumber', 'Unit number', 'text', 'B-204')}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Min 12 characters"
                required
                minLength={12}
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
            {errors.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Confirm password</label>
            <Input
              type={showPw ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              required
              minLength={12}
              className="rounded-xl"
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword[0]}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-primary">
            {loading ? 'Creating account…' : <><UserPlus size={16} className="mr-2" /> {isMemberInvite ? 'Request to join' : 'Create account'}</>}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={isMemberInvite ? inviteLoginPath(joinCommunityId, invitedCommunityName) : "/login"} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
