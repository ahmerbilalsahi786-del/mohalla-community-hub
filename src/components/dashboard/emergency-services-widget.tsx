import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'wouter'
import {
  Ambulance,
  ChevronDown,
  Flame,
  MapPin,
  Phone,
  PhoneCall,
  Search,
  Shield,
  ShieldAlert,
  Wrench,
  Stethoscope,
} from 'lucide-react'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

type CommunityContact = {
  id: string
  category: 'emergency' | 'services' | 'medical'
  type: string
  name: string
  phone_number: string | null
  latitude: number | null
  longitude: number | null
  display_order: number
  is_emergency: boolean
}

const EMERGENCY_PRIORITY: Record<string, number> = {
  ambulance: 1,
  police: 2,
  fire_brigade: 3,
  fire: 3,
  security: 4,
  community_security: 4,
}

function contactLabel(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function contactIcon(type: string, emergency: boolean) {
  if (type.includes('ambulance')) return Ambulance
  if (type.includes('hospital') || type.includes('clinic') || type.includes('doctor') || type.includes('medical')) return Stethoscope
  if (type.includes('fire')) return Flame
  if (type.includes('police') || type.includes('security')) return Shield
  if (emergency) return ShieldAlert
  return Wrench
}

function cleanPhoneNumber(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}

async function loadCommunityContacts(communityId?: string) {
  if (!communityId) return []
  const { data, error } = await (supabase as any)
    .from('community_contacts')
    .select('id, category, type, name, phone_number, latitude, longitude, display_order, is_emergency')
    .eq('community_id', communityId)
    .order('is_emergency', { ascending: false })
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as CommunityContact[]
}

function ContactRow({ contact, emergency }: { contact: CommunityContact; emergency: boolean }) {
  const Icon = contactIcon(contact.type, emergency)
  const phone = contact.phone_number?.trim()
  const hasMap = contact.latitude != null && contact.longitude != null

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', emergency ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary')}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{contact.name || contactLabel(contact.type)}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <span className="truncate font-semibold text-foreground/80">{contactLabel(contact.type)}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{phone || 'Not set'}</span>
          {hasMap && (
            <a
              href={`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Maps"
              className="inline-flex shrink-0 items-center text-primary hover:text-primary/80"
            >
              <MapPin size={12} />
            </a>
          )}
        </p>
      </div>
      {hasMap && (
        <a
          href={`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open map for ${contact.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <MapPin size={15} />
        </a>
      )}
      {phone ? (
        <a
          href={`tel:${cleanPhoneNumber(phone)}`}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
            emergency ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          aria-label={`Call ${contact.name}`}
        >
          <PhoneCall size={15} />
        </a>
      ) : (
        <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">Not set</span>
      )}
    </div>
  )
}

export function EmergencyServicesWidget() {
  const { data: user } = useCurrentUser()
  const [servicesOpen, setServicesOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(true)
  const [showAllServices, setShowAllServices] = useState(false)
  const [search, setSearch] = useState('')
  const communityId = user?.community?.id
  const isAdmin = canManageCommunity(user?.role)

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['community-contacts', communityId],
    queryFn: () => loadCommunityContacts(communityId),
    enabled: Boolean(communityId),
  })

  const emergencyContacts = contacts
    .filter((contact) => contact.is_emergency || contact.category === 'emergency' || contact.category === 'medical')
    .sort((a, b) => {
      const priorityA = EMERGENCY_PRIORITY[a.type] ?? 99
      const priorityB = EMERGENCY_PRIORITY[b.type] ?? 99
      if (priorityA !== priorityB) return priorityA - priorityB
      return (a.display_order ?? 0) - (b.display_order ?? 0)
    })
  const serviceContacts = contacts
    .filter((contact) => !contact.is_emergency && contact.category === 'services')
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  const contactMatches = (contact: CommunityContact) => {
    const needle = search.trim().toLowerCase()
    if (!needle) return true
    return [contact.name, contact.type, contact.category]
      .some((value) => String(value ?? '').toLowerCase().includes(needle))
  }
  const filteredEmergencyContacts = emergencyContacts.filter(contactMatches)
  const filteredServiceContacts = serviceContacts.filter(contactMatches)
  const visibleServices = showAllServices || search.trim() ? filteredServiceContacts : filteredServiceContacts.slice(0, 5)

  return (
    <section className="portal-panel delight-hover-lift overflow-hidden rounded-2xl">
      <button
        onClick={() => setMobileOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 border-b portal-soft-rule px-4 py-4 text-left lg:cursor-default"
      >
        <span className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="delight-swing-soft flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
            <Phone size={16} />
          </span>
          Emergency & services
        </span>
        <ChevronDown size={16} className={cn('text-muted-foreground transition-transform lg:hidden', mobileOpen && 'rotate-180')} />
      </button>

      <div className={cn('space-y-4 p-4', !mobileOpen && 'hidden lg:block')}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or occupation"
            className="h-10 w-full rounded-xl border border-border bg-background/70 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">Emergency</p>
            <span className="ml-2 h-px flex-1 bg-red-500/20" />
          </div>
          <div className="space-y-2.5">
            {isLoading ? (
              [1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-muted" />)
            ) : filteredEmergencyContacts.length > 0 ? (
              filteredEmergencyContacts.map((contact) => <ContactRow key={contact.id} contact={contact} emergency />)
            ) : (
              <p className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {search.trim() ? 'No emergency contacts match that search.' : 'Emergency contacts are being set up.'}
              </p>
            )}
          </div>
        </div>

        <div>
          <button
            onClick={() => setServicesOpen((open) => !open)}
            className="mb-2.5 flex w-full items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Services
              <span className="h-px w-12 bg-border" />
            </span>
            <ChevronDown size={15} className={cn('text-muted-foreground transition-transform', servicesOpen && 'rotate-180')} />
          </button>

          {servicesOpen && (
            <div className="space-y-2.5">
              {filteredServiceContacts.length > 0 ? (
                <>
                  {visibleServices.map((contact) => <ContactRow key={contact.id} contact={contact} emergency={false} />)}
                  {filteredServiceContacts.length > 5 && !showAllServices && !search.trim() && (
                    <button onClick={() => setShowAllServices(true)} className="text-xs font-semibold text-primary hover:text-primary/80">
                      View all
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-muted/40 px-3 py-2">
                  <p className="text-xs text-muted-foreground">No services added yet</p>
                  {isAdmin && (
                    <Link href="/admin/contacts" className="mt-1 inline-flex text-xs font-semibold text-primary hover:text-primary/80">
                      Add contact
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
