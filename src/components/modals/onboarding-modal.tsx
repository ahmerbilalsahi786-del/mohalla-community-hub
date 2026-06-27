import { useState, useEffect } from 'react'
import { User, MessageSquare, LayoutDashboard, X, ChevronRight, Check } from 'lucide-react'
import { Link } from 'wouter'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'mohalla_onboarding_steps'

const STEPS = [
  {
    id: 'profile',
    icon: User,
    title: 'Complete your profile',
    description: 'Add your name, unit number and WhatsApp so neighbours can reach you.',
    href: '/profile/me',
    cta: 'Go to Profile',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'introduce',
    icon: MessageSquare,
    title: 'Introduce yourself',
    description: 'Post a quick hello to the Community Feed so neighbours know you moved in!',
    href: '/feed',
    cta: 'Open Feed',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    id: 'explore',
    icon: LayoutDashboard,
    title: 'Explore the community',
    description: 'Check upcoming events, active polls, and the marketplace.',
    href: '/dashboard',
    cta: 'Go to Dashboard',
    color: 'text-green-600',
    bg: 'bg-green-500/10',
  },
]

export function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [done, setDone] = useState<string[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'dismissed') return
    const saved: string[] = raw ? JSON.parse(raw) : []
    setDone(saved)
    // Show if not all steps complete and not dismissed
    if (saved.length < STEPS.length) {
      const t = setTimeout(() => setShow(true), 1800)
      return () => clearTimeout(t)
    }
  }, [])

  const markDone = (id: string) => {
    const next = [...new Set([...done, id])]
    setDone(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setShow(false)
  }

  if (!show) return null

  const completed = done.length
  const total = STEPS.length
  const pct = Math.round((completed / total) * 100)
  const allDone = completed >= total

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden md:bottom-6 md:right-6">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3.5 border-b border-border bg-muted/30">
        <div>
          <p className="font-semibold text-sm text-foreground">
            {allDone ? '🎉 You\'re all set!' : 'Welcome to Mohalla!'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDone ? 'Enjoy your community hub' : `${completed} of ${total} steps complete`}
          </p>
        </div>
        <button onClick={dismiss} className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground shrink-0 mt-0.5">
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {STEPS.map((step) => {
          const isDone = done.includes(step.id)
          const Icon = step.icon
          return (
            <div key={step.id} className={cn('flex items-start gap-3 px-4 py-3', isDone && 'opacity-60')}>
              {/* Icon / checkmark */}
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-0.5 transition-colors',
                isDone ? 'bg-green-500/10' : step.bg
              )}>
                {isDone
                  ? <Check size={16} className="text-green-600" />
                  : <Icon size={16} className={step.color} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>
                  {step.title}
                </p>
                {!isDone && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.description}</p>
                )}
              </div>
              {!isDone && (
                <Link href={step.href}>
                  <button
                    onClick={() => markDone(step.id)}
                    className="flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 shrink-0 mt-1 transition-colors"
                  >
                    {step.cta} <ChevronRight size={12} />
                  </button>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {allDone && (
        <div className="px-4 py-3 border-t border-border">
          <Button onClick={dismiss} className="w-full rounded-xl text-sm">
            Got it, close
          </Button>
        </div>
      )}
    </div>
  )
}
