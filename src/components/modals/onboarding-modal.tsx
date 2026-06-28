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
  const [expanded, setExpanded] = useState(false)

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
    <div className="fixed bottom-5 right-5 z-50 hidden w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border portal-soft-rule bg-card shadow-2xl shadow-black/10 md:block">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b portal-soft-rule bg-muted/25 px-4 py-3.5">
        <button type="button" onClick={() => setExpanded((open) => !open)} className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-sm text-foreground">
            {allDone ? 'All set' : 'Setup Guide'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {allDone ? 'Enjoy your community hub' : `${completed} of ${total} steps complete`}
          </p>
        </button>
        {!expanded && !allDone && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-0.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground"
          >
            View
          </button>
        )}
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
      {expanded && (
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
      )}

      {expanded && allDone && (
        <div className="px-4 py-3 border-t border-border">
          <Button onClick={dismiss} className="w-full rounded-xl text-sm">
            Got it, close
          </Button>
        </div>
      )}
    </div>
  )
}
