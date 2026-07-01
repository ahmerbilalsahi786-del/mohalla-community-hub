import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, Clock, Users, CheckCircle2, Plus, Edit2, Loader2, X, MapPin } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUser } from '@/lib/auth'
import { supabase } from '@/integrations/supabase/client'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import LocationPicker, { type PickedLocation } from '@/components/location-picker'

type Opportunity = {
  id: string
  title: string
  description: string
  category: string
  schedule: string
  location: string | null
  latitude?: number | null
  longitude?: number | null
  capacity: number | null
  is_active: boolean
  joinedCount: number
  isJoined: boolean
}

type OpportunityForm = {
  title: string
  description: string
  category: string
  schedule: string
  location: string
  latitude: number | null
  longitude: number | null
  capacity: string
}

const EMPTY_FORM: OpportunityForm = {
  title: '',
  description: '',
  category: 'Community',
  schedule: '',
  location: '',
  latitude: null,
  longitude: null,
  capacity: '',
}

const OPPORTUNITIES: Opportunity[] = [
  {
    id: '1',
    title: 'Park Cleanup Drive',
    description: 'Help us clean and beautify Central Park. Gloves and bags provided.',
    schedule: 'Sat, Jun 7 · 7:00 AM – 10:00 AM',
    location: 'Central Park',
    capacity: 20,
    joinedCount: 12,
    category: 'Environment',
    is_active: true,
    isJoined: false,
  },
  {
    id: '2',
    title: 'Food Distribution',
    description: 'Monthly food drive for underprivileged families near the mohalla.',
    schedule: 'Sun, Jun 8 · 10:00 AM – 1:00 PM',
    location: 'Community Hall',
    capacity: 10,
    joinedCount: 6,
    category: 'Social',
    is_active: true,
    isJoined: false,
  },
  {
    id: '3',
    title: 'Senior Residents Help',
    description: 'Assist elderly residents with groceries, errands, and tech support.',
    schedule: 'Every Saturday · 3:00 PM – 5:00 PM',
    location: 'Management Office',
    capacity: 5,
    joinedCount: 2,
    category: 'Care',
    is_active: true,
    isJoined: false,
  },
  {
    id: '4',
    title: 'Kids Tutoring Session',
    description: 'Volunteer tutors needed for primary school students at the Learning Centre.',
    schedule: 'Mon & Wed · 4:00 PM – 6:00 PM',
    location: 'Learning Centre',
    capacity: 8,
    joinedCount: 4,
    category: 'Education',
    is_active: true,
    isJoined: false,
  },
]

const CAT_COLORS: Record<string, string> = {
  Environment: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
  Social: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  Care: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  Education: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  Community: 'bg-muted text-muted-foreground dark:bg-muted/70 dark:text-muted-foreground',
}

function toForm(opportunity: Opportunity): OpportunityForm {
  return {
    title: opportunity.title,
    description: opportunity.description,
    category: opportunity.category,
    schedule: opportunity.schedule,
    location: opportunity.location ?? '',
    latitude: opportunity.latitude ?? null,
    longitude: opportunity.longitude ?? null,
    capacity: opportunity.capacity ? String(opportunity.capacity) : '',
  }
}

function OpportunityModal({
  form,
  saving,
  title,
  onChange,
  onClose,
  onSubmit,
}: {
  form: OpportunityForm
  saving: boolean
  title: string
  onChange: (next: OpportunityForm) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const update = (patch: Partial<OpportunityForm>) => onChange({ ...form, ...patch })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">Visible to approved residents in this community.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
            <input
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder="Volunteer opportunity title"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
              rows={3}
              placeholder="What should volunteers know?"
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
              <input
                value={form.category}
                onChange={(event) => update({ category: event.target.value })}
                placeholder="Environment, Care, Education..."
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(event) => update({ capacity: event.target.value })}
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schedule</label>
              <input
                value={form.schedule}
                onChange={(event) => update({ schedule: event.target.value })}
                placeholder="e.g. Saturday, 4pm-6pm"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</label>
              <input
                value={form.location}
                onChange={(event) => update({ location: event.target.value })}
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Map Tag (optional)</label>
            <LocationPicker
              compact
              initialLat={form.latitude}
              initialLng={form.longitude}
              onSelect={(data: PickedLocation) => update({
                latitude: data.latitude,
                longitude: data.longitude,
                location: form.location.trim() ? form.location : data.address,
              })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button type="submit" disabled={saving || !form.title.trim() || !form.description.trim() || !form.schedule.trim()} className="gap-2 rounded-xl">
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save opportunity
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function Volunteer() {
  const [joined, setJoined] = useState<string[]>([])
  const demo = getUser()?.userId === 'ahmed' && getUser()?.email === 'demo@mohalla.app'
  const { data: user } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const communityId = user?.community?.id
  const canEdit = canManageCommunity(user?.role)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)
  const [form, setForm] = useState<OpportunityForm>(EMPTY_FORM)

  const { data: remote = [], isLoading } = useQuery({
    queryKey: ['volunteer-opportunities', communityId],
    enabled: Boolean(communityId) && !demo,
    queryFn: async () => {
      if (!communityId || !user?.userId) return []
      const [{ data: opportunities, error }, { data: signups, error: signupError }] = await Promise.all([
        (supabase as any)
          .from('volunteer_opportunities')
          .select('*, volunteer_signups(user_id)')
          .eq('community_id', communityId)
          .eq('is_active', true)
          .order('created_at'),
        (supabase as any)
          .from('volunteer_signups')
          .select('opportunity_id')
          .eq('user_id', user.userId),
      ])

      if (error) throw error
      if (signupError) throw signupError

      const joinedIds = new Set((signups ?? []).map((row: any) => row.opportunity_id))
      return (opportunities ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        schedule: row.schedule,
        location: row.location ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        capacity: row.capacity ?? null,
        is_active: row.is_active,
        joinedCount: row.volunteer_signups?.length ?? 0,
        isJoined: joinedIds.has(row.id),
      })) as Opportunity[]
    },
  })

  const saveOpportunity = useMutation({
    mutationFn: async () => {
      if (!communityId || !user?.userId) throw new Error('Community not loaded.')
      if (!canEdit) throw new Error('Only admins and moderators can manage volunteer opportunities.')
      const payload = {
        community_id: communityId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim() || 'Community',
        schedule: form.schedule.trim(),
        location: form.location.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
        capacity: form.capacity.trim() ? Number(form.capacity) : null,
        created_by: user.userId,
        updated_at: new Date().toISOString(),
        is_active: true,
      }

      const request = editing
        ? (supabase as any).from('volunteer_opportunities').update(payload).eq('id', editing.id).select('id').single()
        : (supabase as any).from('volunteer_opportunities').insert(payload).select('id').single()

      const { data, error } = await request
      if (error) throw error
      if (!data?.id) throw new Error('Volunteer opportunity was not saved. Please try again.')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['volunteer-opportunities', communityId] })
      setModalOpen(false)
      toast({ title: editing ? 'Opportunity updated' : 'Opportunity added' })
    },
    onError: (error) => {
      console.error('Failed to save volunteer opportunity', error)
      toast({
        title: 'Could not save opportunity',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    },
  })

  const toggleSignup = useMutation({
    mutationFn: async ({ opportunityId, joined }: { opportunityId: string; joined: boolean }) => {
      if (!user?.userId) throw new Error('You need to be signed in.')
      if (joined) {
        const { error } = await (supabase as any)
          .from('volunteer_signups')
          .delete()
          .eq('opportunity_id', opportunityId)
          .eq('user_id', user.userId)
        if (error) throw error
        return
      }

      const { error } = await (supabase as any)
        .from('volunteer_signups')
        .insert({ opportunity_id: opportunityId, user_id: user.userId })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['volunteer-opportunities', communityId] })
    },
  })

  const opportunities: Opportunity[] = demo
    ? OPPORTUNITIES
    : (remote as Opportunity[])

  const joinedCount = demo ? joined.length : opportunities.filter((item) => item.isJoined).length

  const toggle = (id: string) =>
    setJoined((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (opportunity: Opportunity) => {
    setEditing(opportunity)
    setForm(toForm(opportunity))
    setModalOpen(true)
  }

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Volunteer Opportunities</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Give back to your community</p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button onClick={openAdd} className="gap-2 rounded-xl">
                    <Plus size={15} />
                    Add opportunity
                  </Button>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10">
                  <Heart size={22} className="text-rose-500" />
                </div>
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Active drives', value: opportunities.length },
                { label: 'Spots available', value: opportunities.reduce((s, o) => s + Math.max(0, (o.capacity ?? 0) - o.joinedCount), 0) },
                { label: 'You joined', value: joinedCount },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {isLoading && !demo ? [1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl bg-muted" />) : opportunities.map((opp) => {
                const isJoined = demo ? joined.includes(opp.id) : opp.isJoined
                const full = (opp.capacity ?? 999) > 0 && opp.joinedCount >= (opp.capacity ?? 999)
                const catCls = CAT_COLORS[opp.category] ?? CAT_COLORS.Community
                const pct = opp.capacity ? Math.min(100, Math.round((opp.joinedCount / opp.capacity) * 100)) : 0

                return (
                  <div key={opp.id} className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                        <Heart size={20} className="text-rose-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{opp.title}</h3>
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', catCls)}>{opp.category}</span>
                          {isJoined && (
                            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-300">
                              <CheckCircle2 size={11} /> Joined
                            </span>
                          )}
                          {canEdit && !demo && (
                            <button
                              type="button"
                              onClick={() => openEdit(opp)}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80"
                            >
                              <Edit2 size={11} /> Edit
                            </button>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{opp.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={12} /> {opp.schedule}</span>
                          <span className="flex items-center gap-1"><Users size={12} /> {opp.joinedCount}/{opp.capacity ?? '∞'} signed up</span>
                          {opp.location && (
                            opp.latitude != null && opp.longitude != null ? (
                              <a
                                href={`https://www.google.com/maps?q=${opp.latitude},${opp.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <MapPin size={12} /> {opp.location}
                              </a>
                            ) : (
                              <span className="flex items-center gap-1"><MapPin size={12} /> {opp.location}</span>
                            )
                          )}
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => demo ? toggle(String(opp.id)) : toggleSignup.mutate({ opportunityId: opp.id, joined: isJoined })}
                        disabled={(full && !isJoined) || toggleSignup.isPending}
                        className={cn(
                          'rounded-xl',
                          isJoined
                            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : full
                              ? 'cursor-not-allowed opacity-50'
                              : 'bg-primary text-primary-foreground'
                        )}
                      >
                        {isJoined ? 'Leave' : full ? 'Full' : 'Join'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <OpportunityModal
          form={form}
          saving={saveOpportunity.isPending}
          title={editing ? 'Edit opportunity' : 'Add opportunity'}
          onChange={setForm}
          onClose={() => setModalOpen(false)}
          onSubmit={() => saveOpportunity.mutate()}
        />
      )}
    </div>
  )
}
