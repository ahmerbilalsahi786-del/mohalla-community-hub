import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { MapPin, Building2, Trees, ShoppingCart, Stethoscope, GraduationCap, Utensils } from 'lucide-react'

const PLACES = [
  {
    category: 'Essentials',
    items: [
      { name: 'Main Gate Reception',    icon: Building2,    detail: 'Open 24/7 · Ground Floor',     tag: 'Security' },
      { name: 'Management Office',      icon: Building2,    detail: 'Mon–Sat 9am–5pm · Block A',     tag: 'Admin' },
      { name: 'Resident Parking (B2)',  icon: Building2,    detail: 'Basement Level 2',              tag: 'Parking' },
    ],
  },
  {
    category: 'Green Spaces',
    items: [
      { name: 'Central Park',           icon: Trees,        detail: 'Open dawn to dusk',             tag: 'Park' },
      { name: 'Children\'s Play Area',  icon: Trees,        detail: 'Near Block C · Open daily',     tag: 'Kids' },
      { name: 'Rooftop Garden',         icon: Trees,        detail: 'Building B · Level 12',         tag: 'Garden' },
    ],
  },
  {
    category: 'Shopping & Food',
    items: [
      { name: 'Mini Mart',              icon: ShoppingCart, detail: 'Ground Floor · 8am–11pm',       tag: 'Shop' },
      { name: 'Café Mohalla',           icon: Utensils,     detail: 'Block A · Mon–Sun 7am–10pm',    tag: 'Food' },
      { name: 'Bakery Corner',          icon: Utensils,     detail: 'Near East Gate · 7am–9pm',      tag: 'Food' },
    ],
  },
  {
    category: 'Health & Education',
    items: [
      { name: 'Community Clinic',       icon: Stethoscope,  detail: 'Block D · Mon–Fri 9am–6pm',    tag: 'Health' },
      { name: 'Pharmacy',               icon: Stethoscope,  detail: 'Ground Floor · 24/7',           tag: 'Health' },
      { name: 'Learning Centre',        icon: GraduationCap,detail: 'Block B · After school hours',  tag: 'Edu' },
    ],
  },
]

const TAG_COLORS: Record<string, string> = {
  Security: 'bg-red-100 text-red-700',
  Admin:    'bg-blue-100 text-blue-700',
  Parking:  'bg-slate-100 text-slate-600',
  Park:     'bg-green-100 text-green-700',
  Kids:     'bg-yellow-100 text-yellow-700',
  Garden:   'bg-emerald-100 text-emerald-700',
  Shop:     'bg-purple-100 text-purple-700',
  Food:     'bg-orange-100 text-orange-700',
  Health:   'bg-rose-100 text-rose-700',
  Edu:      'bg-indigo-100 text-indigo-700',
}

export default function Places() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Places & Facilities</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Everything inside your mohalla</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <MapPin size={22} className="text-primary" />
              </div>
            </div>

            <div className="space-y-8">
              {PLACES.map((section) => (
                <div key={section.category}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    {section.category}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((place) => {
                      const Icon = place.icon
                      const tagCls = TAG_COLORS[place.tag] ?? 'bg-muted text-muted-foreground'
                      return (
                        <div key={place.name} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <Icon size={18} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground leading-tight">{place.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{place.detail}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tagCls}`}>
                              {place.tag}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
