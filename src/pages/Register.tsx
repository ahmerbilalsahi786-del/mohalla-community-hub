import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setToken } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'

export default function Register() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [form, setForm] = useState({ email: '', password: '', userId: '', name: '', unitNumber: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.fields) setErrors(data.fields)
        toast({ title: data.error || 'Registration failed', variant: 'destructive' })
        return
      }
      setToken(data.token)
      navigate('/')
    } catch {
      toast({ title: 'Cannot connect to server.', variant: 'destructive' })
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
          <h1 className="text-2xl font-bold text-foreground">Join your Mohalla</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your community account</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
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
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-primary">
            {loading ? 'Creating account…' : <><UserPlus size={16} className="mr-2" /> Create account</>}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
