import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type CharacterVariant = 'wave' | 'calendar' | 'shop' | 'helper'

type CommunityCharacterProps = {
  variant?: CharacterVariant
  className?: string
  delay?: string
}

const variantTone: Record<CharacterVariant, string> = {
  wave: 'text-primary',
  calendar: 'text-accent',
  shop: 'text-amber-600',
  helper: 'text-green-700 dark:text-green-300',
}

export function CommunityCharacter({
  variant = 'wave',
  className,
  delay = '0s',
}: CommunityCharacterProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('mohalla-character inline-flex', variantTone[variant], className)}
      style={{ '--delight-delay': delay } as CSSProperties}
    >
      <svg viewBox="0 0 120 120" role="img" focusable="false" className="h-full w-full">
        <circle cx="60" cy="61" r="43" fill="var(--glass-surface-strong)" />
        <path
          d="M29 82c7-17 20-25 32-25s25 8 32 25"
          fill="color-mix(in oklch, currentColor 18%, var(--card))"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="60" cy="41" r="17" fill="var(--card)" stroke="currentColor" strokeWidth="4" />
        <path d="M47 38c5-11 18-15 30-4" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <circle cx="54" cy="43" r="2.2" fill="currentColor" />
        <circle cx="67" cy="43" r="2.2" fill="currentColor" />
        <path d="M54 51c4 4 10 4 14 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path className="mohalla-character-arm" d="M34 72c-12-8-16-18-10-26" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <path d="M86 72c11-8 15-17 11-24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        {variant === 'calendar' && (
          <g className="mohalla-character-prop">
            <rect x="74" y="70" width="26" height="22" rx="5" fill="var(--card)" stroke="currentColor" strokeWidth="3" />
            <path d="M80 77h14M80 84h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {variant === 'shop' && (
          <g className="mohalla-character-prop">
            <path d="M76 70h24l-3 9H79z" fill="var(--card)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M80 79v15h16V79" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {variant === 'helper' && (
          <g className="mohalla-character-prop">
            <path d="M84 68l13 7v10c0 8-5 13-13 16-8-3-13-8-13-16V75z" fill="var(--card)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <path d="M79 84l4 4 8-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
    </span>
  )
}

type ClickBurst = {
  id: number
  x: number
  y: number
}

export function ClickSparkles() {
  const [bursts, setBursts] = useState<ClickBurst[]>([])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    let nextId = 1

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const control = target?.closest('button, a, [role="button"], [data-slot="button"], [data-delight-click]')
      if (!control) return
      if (control.getAttribute('aria-disabled') === 'true') return
      if ('disabled' in control && Boolean((control as HTMLButtonElement).disabled)) return

      const id = nextId++
      const rect = control.getBoundingClientRect()
      const x = event.clientX || rect.left + rect.width / 2
      const y = event.clientY || rect.top + rect.height / 2
      setBursts((current) => [...current.slice(-6), { id, x, y }])
      window.setTimeout(() => {
        setBursts((current) => current.filter((burst) => burst.id !== id))
      }, 920)
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  return (
    <div className="mohalla-click-layer" aria-hidden="true">
      {bursts.map((burst) => (
        <span
          key={burst.id}
          className="mohalla-click-burst"
          style={{ left: burst.x, top: burst.y } as CSSProperties}
        >
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      ))}
    </div>
  )
}

export function AppDelightLayer() {
  return <ClickSparkles />
}
