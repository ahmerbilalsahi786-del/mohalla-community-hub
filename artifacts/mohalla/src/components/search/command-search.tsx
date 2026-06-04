import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'wouter'
import { Search, MessageSquare, ShoppingBag, Users, X, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Result {
  id: string
  type: 'post' | 'listing' | 'member'
  title: string
  subtitle: string
  href: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const TYPE_CONFIG = {
  post:    { icon: MessageSquare, label: 'Post',    color: 'text-blue-500' },
  listing: { icon: ShoppingBag,   label: 'Listing', color: 'text-green-600' },
  member:  { icon: Users,         label: 'Member',  color: 'text-primary' },
}

export function CommandSearch() {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const [, navigate] = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 280)

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus input when open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults([]); return }
    const q = debouncedQuery.trim()
    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        const [postsRes, listingsRes, membersRes] = await Promise.allSettled([
          fetch(`/api/feed?search=${encodeURIComponent(q)}&limit=4`).then(r => r.json()),
          fetch(`/api/listings?search=${encodeURIComponent(q)}&limit=4`).then(r => r.json()),
          fetch(`/api/admin/members?communityId=default&limit=4`).then(r => r.json()),
        ])

        if (cancelled) return

        const out: Result[] = []

        if (postsRes.status === 'fulfilled' && postsRes.value?.posts) {
          for (const p of postsRes.value.posts.slice(0, 4)) {
            out.push({ id: `post-${p.id}`, type: 'post', title: p.title, subtitle: `by ${p.userName} · ${p.type}`, href: '/feed' })
          }
        }

        if (listingsRes.status === 'fulfilled' && listingsRes.value?.listings) {
          for (const l of listingsRes.value.listings.slice(0, 4)) {
            out.push({ id: `listing-${l.id}`, type: 'listing', title: l.title, subtitle: `Rs ${(l.pricePkr ?? 0).toLocaleString()} · ${l.userName}`, href: `/marketplace/${l.id}` })
          }
        }

        if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value)) {
          const qLow = q.toLowerCase()
          for (const m of (membersRes.value as any[]).filter(m =>
            m.name?.toLowerCase().includes(qLow) ||
            m.unitNumber?.toLowerCase().includes(qLow)
          ).slice(0, 4)) {
            out.push({ id: `member-${m.id}`, type: 'member', title: m.name, subtitle: `Unit ${m.unitNumber}`, href: `/profile/${m.userId}` })
          }
        }

        setResults(out)
        setSelected(0)
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()

    return () => { cancelled = true }
  }, [debouncedQuery])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected].href)
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {loading ? <Loader2 size={18} className="text-muted-foreground animate-spin shrink-0" /> : <Search size={18} className="text-muted-foreground shrink-0" />}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts, listings, members..."
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:block">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {results.map((r, i) => {
              const cfg = TYPE_CONFIG[r.type]
              const Icon = cfg.icon
              return (
                <button
                  key={r.id}
                  onClick={() => { navigate(r.href); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    i === selected && 'bg-muted/50'
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <Icon size={15} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                  </div>
                  <span className="text-xs text-muted-foreground/60 shrink-0">{cfg.label}</span>
                  <ArrowRight size={14} className="text-muted-foreground/40 shrink-0" />
                </button>
              )
            })}
          </div>
        ) : query && !loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Search size={24} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No results for "{query}"</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try a different keyword</p>
          </div>
        ) : !query ? (
          <div className="px-4 py-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick links</p>
            {[
              { label: 'Community Feed', href: '/feed', icon: MessageSquare },
              { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
              { label: 'My Profile', href: '/profile/ahmed', icon: Users },
            ].map(q => (
              <button key={q.href} onClick={() => { navigate(q.href); setOpen(false) }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground">
                <q.icon size={15} />
                {q.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground/60">
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">↵</kbd> open</span>
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
