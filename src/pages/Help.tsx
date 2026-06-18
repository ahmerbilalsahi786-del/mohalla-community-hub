import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import { HelpCircle, MessageSquare, ShieldAlert, ShoppingBag, Calendar, Users, ChevronRight } from 'lucide-react'
import { Link } from 'wouter'

const FAQ = [
  {
    q: 'How do I report a safety alert?',
    a: 'Go to Safety & Alerts and tap "+ Report Alert". Fill in the category, description and location then submit.',
  },
  {
    q: 'How do I list something in the Marketplace?',
    a: 'Open Marketplace and tap the "+ New Listing" button. Add photos, a title, price and your WhatsApp number.',
  },
  {
    q: 'Can I delete my post?',
    a: 'Yes. Open the post, tap the three-dot menu (⋯) and choose "Delete Post". This is permanent.',
  },
  {
    q: 'How do I update my profile or unit number?',
    a: 'Go to your Profile page (click your avatar in the top-right or visit /profile/ahmed) and tap "Edit Profile".',
  },
  {
    q: 'How do I turn off notifications?',
    a: 'Go to Settings → Notifications and toggle off the categories you don\'t want.',
  },
]

const QUICK_LINKS = [
  { label: 'Community Feed',  href: '/feed',       icon: MessageSquare },
  { label: 'Safety & Alerts', href: '/safety',     icon: ShieldAlert },
  { label: 'Marketplace',     href: '/marketplace',icon: ShoppingBag },
  { label: 'Events',          href: '/events',     icon: Calendar },
  { label: 'Community',       href: '/community',  icon: Users },
]

export default function Help() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <HelpCircle size={22} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Help & Support</h2>
                <p className="text-sm text-muted-foreground">Answers to common questions</p>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Frequently Asked</h3>
              <div className="space-y-3">
                {FAQ.map((item) => (
                  <details key={item.q} className="group rounded-2xl border border-border bg-card overflow-hidden">
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-foreground list-none">
                      {item.q}
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Quick links</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {QUICK_LINKS.map((l) => {
                  const Icon = l.icon
                  return (
                    <Link key={l.href} href={l.href}>
                      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                          <Icon size={16} className="text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{l.label}</span>
                        <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-accent/5 p-5 text-center">
              <p className="font-semibold text-foreground">Still need help?</p>
              <p className="text-sm text-muted-foreground mt-1">Contact your community admin via the Safety page or WhatsApp.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
