import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Building2, Trees, ShoppingCart, Stethoscope, GraduationCap, Utensils, Plus, Edit2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { supabase } from '@/integrations/supabase/client'
import { getUser } from '@/lib/auth'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import LocationPicker, { type PickedLocation } from '@/components/location-picker'

type PlaceRow = {
  id: string
  name: string
  category: string
  description: string
  location: string | null
  hours: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

type PlaceForm = {
  name: string
  category: string
  description: string
  location: string
  hours: string
  phone: string
  latitude: number | null
  longitude: number | null
}

const PLACE_CATEGORIES = ['Essentials', 'Green Spaces', 'Shopping & Food', 'Health & Education', 'Other']

const EMPTY_FORM: PlaceForm = {
  name: '',
  category: 'Essentials',
  description: '',
  location: '',
  hours: '',
  phone: '',
  latitude: null,
  longitude: null,
}

const DEMO_PLACES = [
  {
    category: 'Essentials',
    items: [
      { name: 'Main Gate Reception', icon: Building2, detail: 'Open 24/7 · Ground Floor', tag: 'Security' },
      { name: 'Management Office', icon: Building2, detail: 'Mon–Sat 9am–5pm · Block A', tag: 'Admin' },
      { name: 'Resident Parking (B2)', icon: Building2, detail: 'Basement Level 2', tag: 'Parking' },
    ],
  },
  {
    category: 'Green Spaces',
    items: [
      { name: 'Central Park', icon: Trees, detail: 'Open dawn to dusk', tag: 'Park' },
      { name: 'Children\'s Play Area', icon: Trees, detail: 'Near Block C · Open daily', tag: 'Kids' },
      { name: 'Rooftop Garden', icon: Trees, detail: 'Building B · Level 12', tag: 'Garden' },
    ],
  },
  {
    category: 'Shopping & Food',
    items: [
      { name: 'Mini Mart', icon: ShoppingCart, detail: 'Ground Floor · 8am–11pm', tag: 'Shop' },
      { name: 'Café Mohalla', icon: Utensils, detail: 'Block A · Mon–Sun 7am–10pm', tag: 'Food' },
      { name: 'Bakery Corner', icon: Utensils, detail: 'Near East Gate · 7am–9pm', tag: 'Food' },
    ],
  },
  {
    category: 'Health & Education',
    items: [
      { name: 'Community Clinic', icon: Stethoscope, detail: 'Block D · Mon–Fri 9am–6pm', tag: 'Health' },
      { name: 'Pharmacy', icon: Stethoscope, detail: 'Ground Floor · 24/7', tag: 'Health' },
      { name: 'Learning Centre', icon: GraduationCap, detail: 'Block B · After school hours', tag: 'Edu' },
    ],
  },
]

const TAG_COLORS: Record<string, string> = {
  Security: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  Admin: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  Parking: 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300',
  Park: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
  Kids: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300',
  Garden: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  Shop: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  Food: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  Health: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  Edu: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
}

const CATEGORY_ICONS: Record<string, any> = {
  Essentials: Building2,
  'Green Spaces': Trees,
  'Shopping & Food': ShoppingCart,
  'Health & Education': Stethoscope,
  Other: Building2,
}

function placeIcon(category: string) {
  if (category.includes('Health')) return Stethoscope
  if (category.includes('Green')) return Trees
  if (category.includes('Food')) return ShoppingCart
  return Building2
}

function formatPlaceDetail(place: PlaceRow) {
  return [place.location, place.hours].filter(Boolean).join(' · ') || place.description
}

function toForm(place: PlaceRow): PlaceForm {
  return {
    name: place.name,
    category: place.category || 'Other',
    description: place.description || '',
    location: place.location || '',
    hours: place.hours || '',
    phone: place.phone || '',
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
  }
}

function PlaceModal({
  form,
  saving,
  title,
  onChange,
  onClose,
  onSubmit,
}: {
  form: PlaceForm
  saving: boolean
  title: string
  onChange: (next: PlaceForm) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const update = (patch: Partial<PlaceForm>) => onChange({ ...form, ...patch })

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center overflow-hidden bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="flex h-dvh w-full max-w-lg flex-col overflow-hidden border-0 border-border bg-card shadow-xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">Visible to approved members in your community.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
            <input
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="e.g. Community Clinic"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
              <select
                value={form.category}
                onChange={(event) => update({ category: event.target.value })}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                {PLACE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</label>
              <input
                value={form.phone}
                onChange={(event) => update({ phone: event.target.value })}
                placeholder="Optional"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
              rows={3}
              placeholder="Short helpful note for residents"
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</label>
              <input
                value={form.location}
                onChange={(event) => update({ location: event.target.value })}
                placeholder="e.g. Block A"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hours</label>
              <input
                value={form.hours}
                onChange={(event) => update({ hours: event.target.value })}
                placeholder="e.g. Mon-Sat 9am-5pm"
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

        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-muted/20 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-4">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button type="submit" disabled={saving || !form.name.trim()} className="gap-2 rounded-xl">
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save place
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function Places() {
  const demo = getUser()?.userId === 'ahmed' && getUser()?.email === 'demo@mohalla.app'
  const { data: user } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const communityId = user?.community?.id
  const canEdit = canManageCommunity(user?.role)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PlaceRow | null>(null)
  const [form, setForm] = useState<PlaceForm>(EMPTY_FORM)

  const { data: remotePlaces = [], isLoading } = useQuery({
    queryKey: ['places', communityId],
    enabled: Boolean(communityId) && !demo,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('places')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .order('category')
        .order('name')

      if (error) throw error
      return (data ?? []) as PlaceRow[]
    },
  })

  const savePlace = useMutation({
    mutationFn: async () => {
      if (!communityId || !user?.userId) throw new Error('Community not loaded.')
      if (!canEdit) throw new Error('Only admins and moderators can manage places.')
      const payload = {
        community_id: communityId,
        name: form.name.trim(),
        category: form.category.trim() || 'Other',
        description: form.description.trim() || '',
        location: form.location.trim() || null,
        hours: form.hours.trim() || null,
        phone: form.phone.trim() || null,
        latitude: form.latitude,
        longitude: form.longitude,
        created_by: user.userId,
        updated_at: new Date().toISOString(),
      }

      const request = editing
        ? (supabase as any).from('places').update(payload).eq('id', editing.id).select('id').single()
        : (supabase as any).from('places').insert({ ...payload, is_active: true }).select('id').single()

      const { data, error } = await request
      if (error) throw error
      if (!data?.id) throw new Error('Place was not saved. Please try again.')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['places', communityId] })
      setModalOpen(false)
      toast({ title: editing ? 'Place updated' : 'Place added' })
    },
    onError: (error) => {
      console.error('Failed to save place', error)
      toast({
        title: 'Could not save place',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    },
  })

  const sections = useMemo(() => {
    const source = demo
      ? DEMO_PLACES.flatMap((section) => section.items.map((item) => ({ ...item, category: section.category })))
      : remotePlaces.map((place) => ({
          id: place.id,
          name: place.name,
          detail: formatPlaceDetail(place),
          tag: place.category,
          icon: placeIcon(place.category),
          category: place.category,
          record: place,
        }))

    return source.reduce((groups: Record<string, any[]>, item: any) => {
      const category = item.category || 'Other'
      groups[category] = [...(groups[category] ?? []), item]
      return groups
    }, {})
  }, [demo, remotePlaces])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (place: PlaceRow) => {
    setEditing(place)
    setForm(toForm(place))
    setModalOpen(true)
  }

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Places & Facilities</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Everything inside your mohalla</p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button onClick={openAdd} className="gap-2 rounded-xl">
                    <Plus size={15} />
                    Add place
                  </Button>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <MapPin size={22} className="text-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {isLoading && !demo ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
                </div>
              ) : (
                Object.entries(sections).map(([category, items]) => {
                  const Icon = CATEGORY_ICONS[category] ?? Building2
                  return (
                    <section key={category}>
                      <div className="mb-3 flex items-center gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{category}</h3>
                        <span className="h-px flex-1 bg-border" />
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <Icon size={16} />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((place: any) => {
                          const IconItem = place.icon ?? placeIcon(category)
                          const tagCls = TAG_COLORS[place.tag] ?? 'bg-muted text-muted-foreground dark:bg-muted/70 dark:text-muted-foreground'
                          const cardBody = (
                            <>
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                  <IconItem size={18} className="text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-foreground leading-tight">{place.name}</p>
                                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{place.detail}</p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', tagCls)}>
                                  {place.tag}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  {(!canEdit || demo) && place.record?.latitude != null && place.record?.longitude != null && (
                                    <a
                                      href={`https://www.google.com/maps?q=${place.record.latitude},${place.record.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                                    >
                                      <MapPin size={12} />
                                      Map
                                    </a>
                                  )}
                                  {canEdit && !demo && 'record' in place && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                      <Edit2 size={12} />
                                      Edit
                                    </span>
                                  )}
                                </span>
                              </div>
                            </>
                          )

                          if (canEdit && !demo && place.record) {
                            return (
                              <button
                                key={place.name}
                                type="button"
                                onClick={() => openEdit(place.record)}
                                className="rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                              >
                                {cardBody}
                              </button>
                            )
                          }

                          return (
                            <div key={place.name} className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                              {cardBody}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <PlaceModal
          form={form}
          saving={savePlace.isPending}
          title={editing ? 'Edit place' : 'Add place'}
          onChange={setForm}
          onClose={() => setModalOpen(false)}
          onSubmit={() => savePlace.mutate()}
        />
      )}
    </div>
  )
}
