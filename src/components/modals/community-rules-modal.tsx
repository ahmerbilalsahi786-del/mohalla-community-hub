import { useState, useEffect } from 'react'
import { Shield, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'mohalla_rules_accepted'

const RULES = [
  { n: 1, text: 'Be respectful to all community members at all times.' },
  { n: 2, text: 'No spam, advertising, or off-topic content.' },
  { n: 3, text: 'Safety alerts are for genuine emergencies only.' },
  { n: 4, text: 'Marketplace listings must be accurate and honest.' },
  { n: 5, text: 'Report violations to the Admin Panel instead of engaging.' },
]

export function CommunityRulesModal() {
  const [show, setShow] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY)
    if (!accepted) {
      // Small delay so the rest of the app loads first
      const t = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-gradient-to-r from-primary/20 to-accent/10 px-5 py-4 text-center sm:px-6 sm:py-5">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shield size={26} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Community Guidelines</h2>
          <p className="text-sm text-muted-foreground mt-1">Please read and agree before participating</p>
        </div>

        {/* Rules list */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
          {RULES.map((r) => (
            <div key={r.n} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                {r.n}
              </span>
              <p className="text-sm text-foreground leading-snug">{r.text}</p>
            </div>
          ))}
        </div>

        {/* Agreement row */}
        <div className="shrink-0 px-5 pb-4 sm:px-6">
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-center gap-2.5 w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          >
            <div className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
              agreed ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-background'
            )}>
              {agreed && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm text-foreground">
              I understand and agree to follow the community rules.
            </span>
          </button>
        </div>

        {/* CTA */}
        <div className="shrink-0 px-5 pb-5 sm:px-6 sm:pb-6">
          <Button
            onClick={accept}
            disabled={!agreed}
            className="w-full rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
          >
            I Understand – Enter Community
          </Button>
        </div>
      </div>
    </div>
  )
}
