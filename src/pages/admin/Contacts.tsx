import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminLayout } from './AdminLayout'
import { supabase } from '@/integrations/supabase/client'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Loader2,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'

type ContactCategory = 'emergency' | 'services'

type CommunityContact = {
  id: string
  community_id: string
  category: ContactCategory
  type: string
  name: string
  phone_number: string | null
  description: string | null
  display_order: number
  is_emergency: boolean
  created_by_user_id: string | null
  created_at: string
}

type ContactForm = {
  category: ContactCategory
  type: string
  name: string
  phoneNumber: string
  description: string
  isEmergency: boolean
}

const EMPTY_FORM: ContactForm = {
  category: 'services',
  type: '',
  name: '',
  phoneNumber: '',
  description: '',
  isEmergency: false,
}

const PRESETS = [
  'ambulance',
  'police',
  'fire_brigade',
  'security',
  'electrician',
  'plumber',
  'gas',
  'water',
  'admin_office',
]

function labelType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function nextDisplayOrder(contacts: CommunityContact[], category: ContactCategory) {
  const categoryContacts = contacts.filter((contact) => contact.category === category)
  if (!categoryContacts.length) return category === 'emergency' ? 60 : 10
  return Math.max(...categoryContacts.map((contact) => contact.display_order ?? 0)) + 10
}

function toForm(contact: CommunityContact): ContactForm {
  return {
    category: contact.category,
    type: contact.type,
    name: contact.name,
    phoneNumber: contact.phone_number ?? '',
    description: contact.description ?? '',
    isEmergency: contact.is_emergency,
  }
}

async function loadContacts(communityId?: string) {
  if (!communityId) return []
  const { data, error } = await (supabase as any)
    .from('community_contacts')
    .select('*')
    .eq('community_id', communityId)
    .order('is_emergency', { ascending: false })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as CommunityContact[]
}

function ContactModal({
  form,
  saving,
  title,
  onChange,
  onClose,
  onSubmit,
}: {
  form: ContactForm
  saving: boolean
  title: string
  onChange: (form: ContactForm) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const update = (patch: Partial<ContactForm>) => onChange({ ...form, ...patch })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">Only admins and moderators can edit these contacts.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
              <select
                value={form.category}
                onChange={(event) => {
                  const category = event.target.value as ContactCategory
                  update({ category, isEmergency: category === 'emergency' })
                }}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="emergency">Emergency</option>
                <option value="services">Service</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type / label</label>
              <input
                list="contact-type-presets"
                value={form.type}
                onChange={(event) => update({ type: event.target.value })}
                placeholder="e.g. plumber"
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              />
              <datalist id="contact-type-presets">
                {PRESETS.map((preset) => <option key={preset} value={preset}>{labelType(preset)}</option>)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
            <input
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="e.g. Community Security"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone number</label>
            <input
              value={form.phoneNumber}
              onChange={(event) => update({ phoneNumber: event.target.value })}
              placeholder="Leave blank if not set yet"
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => update({ description: event.target.value })}
              rows={3}
              placeholder="Optional note shown to admins only"
              className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm">
            <span className="font-medium text-foreground">Mark as emergency</span>
            <input
              type="checkbox"
              checked={form.isEmergency}
              onChange={(event) => update({ isEmergency: event.target.checked, category: event.target.checked ? 'emergency' : form.category })}
              className="h-4 w-4 accent-primary"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-5 py-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={onSubmit}
            disabled={saving || !form.name.trim() || !form.type.trim()}
            className="gap-2 rounded-xl"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Save contact
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminContacts() {
  const { data: user } = useCurrentUser()
  const queryClient = useQueryClient()
  const communityId = user?.community?.id
  const canManage = canManageCommunity(user?.role)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CommunityContact | null>(null)
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM)

  const queryKey = useMemo(() => ['community-contacts', communityId], [communityId])
  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => loadContacts(communityId),
    enabled: Boolean(communityId),
  })

  useEffect(() => {
    if (!modalOpen) {
      setEditing(null)
      setForm(EMPTY_FORM)
    }
  }, [modalOpen])

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const saveContact = useMutation({
    mutationFn: async () => {
      if (!communityId || !user?.userId) throw new Error('Community not loaded.')
      const category = form.isEmergency ? 'emergency' : form.category
      const payload = {
        community_id: communityId,
        category,
        type: form.type.trim().toLowerCase().replace(/\s+/g, '_'),
        name: form.name.trim(),
        phone_number: form.phoneNumber.trim() || null,
        description: form.description.trim() || null,
        is_emergency: form.isEmergency || category === 'emergency',
      }

      const request = editing
        ? (supabase as any).from('community_contacts').update(payload).eq('id', editing.id)
        : (supabase as any).from('community_contacts').insert({
            ...payload,
            created_by_user_id: user.userId,
            display_order: nextDisplayOrder(contacts, category),
          })

      const { error: requestError } = await request
      if (requestError) throw requestError
    },
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
    },
  })

  const deleteContact = useMutation({
    mutationFn: async (contact: CommunityContact) => {
      const { error: requestError } = await (supabase as any).from('community_contacts').delete().eq('id', contact.id)
      if (requestError) throw requestError
    },
    onSuccess: invalidate,
  })

  const reorderContact = useMutation({
    mutationFn: async ({ contact, direction }: { contact: CommunityContact; direction: -1 | 1 }) => {
      const sameGroup = contacts
        .filter((candidate) => candidate.category === contact.category && candidate.is_emergency === contact.is_emergency)
        .sort((a, b) => a.display_order - b.display_order)
      const index = sameGroup.findIndex((candidate) => candidate.id === contact.id)
      const neighbor = sameGroup[index + direction]
      if (!neighbor) return

      const [{ error: firstError }, { error: secondError }] = await Promise.all([
        (supabase as any).from('community_contacts').update({ display_order: neighbor.display_order }).eq('id', contact.id),
        (supabase as any).from('community_contacts').update({ display_order: contact.display_order }).eq('id', neighbor.id),
      ])
      if (firstError || secondError) throw firstError ?? secondError
    },
    onSuccess: invalidate,
  })

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (contact: CommunityContact) => {
    setEditing(contact)
    setForm(toForm(contact))
    setModalOpen(true)
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Emergency & Services</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage the contacts members see on the Feed page.</p>
          </div>
          <Button onClick={openAdd} disabled={!canManage} className="gap-2 rounded-xl">
            <Plus size={15} />
            Add Contact
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => <div key={item} className="h-12 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="font-medium text-foreground">Could not load contacts</p>
              <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Please refresh and try again.'}</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Phone size={22} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No contacts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Default emergency contacts will appear after community approval.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', contact.is_emergency ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary')}>
                            {contact.is_emergency ? <ShieldAlert size={16} /> : <Wrench size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{labelType(contact.type)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', contact.is_emergency ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground')}>
                          {contact.is_emergency ? 'Emergency' : 'Service'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{contact.phone_number || 'Not set'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => reorderContact.mutate({ contact, direction: -1 })} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <ArrowUp size={14} />
                          </button>
                          <button onClick={() => reorderContact.mutate({ contact, direction: 1 })} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(contact)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${contact.name}?`)) deleteContact.mutate(contact)
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ContactModal
          form={form}
          saving={saveContact.isPending}
          title={editing ? 'Edit contact' : 'Add contact'}
          onChange={setForm}
          onClose={() => setModalOpen(false)}
          onSubmit={() => saveContact.mutate()}
        />
      )}
    </AdminLayout>
  )
}
