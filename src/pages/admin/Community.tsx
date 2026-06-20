import { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout'
import {
  useAdminGetCommunity, useAdminUpdateCommunity, useAdminGetStats,
  getAdminGetCommunityQueryKey,
} from '@/lib/generated/api'
import { useQueryClient } from '@tanstack/react-query'
import { useUpload } from '@/lib/useUpload'
import { InviteTools } from '@/components/community/invite-tools'
import { Building2, Users, FileText, ShoppingBag, ImagePlus, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AdminCommunity() {
  const qc = useQueryClient()
  const { data: settings } = useAdminGetCommunity({ communityId: 'default' })
  const { data: stats } = useAdminGetStats({ communityId: 'default' })

  const [name, setName]   = useState('')
  const [area, setArea]   = useState('')
  const [city, setCity]   = useState('')
  const [rules, setRules] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setName(settings.name ?? '')
      setArea(settings.area ?? '')
      setCity(settings.city ?? '')
      setRules(settings.rules ?? '')
      setLogoUrl(settings.logoUrl ?? undefined)
    }
  }, [settings])

  const update = useAdminUpdateCommunity({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminGetCommunityQueryKey() })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    },
  })

  const { upload, uploading } = useUpload({
    requestUploadUrl: '/api/storage/uploads/request-url',
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await upload(file)
    if (result?.url || result?.objectPath) {
      setLogoUrl(result.url ?? result.objectPath)
    }
  }

  const handleSave = () => {
    update.mutate({ data: { communityId: 'default', name, area, city, rules, logoUrl } })
  }

  const statCards = stats ? [
    { label: 'Total Members',    value: (stats as any).totalMembers,    icon: Users,       color: 'bg-primary/10 text-primary' },
    { label: 'Posts This Month', value: (stats as any).postsThisMonth,  icon: FileText,    color: 'bg-accent/10 text-accent' },
    { label: 'Active Listings',  value: (stats as any).activeListings,  icon: ShoppingBag, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Pending Requests', value: (stats as any).pendingMembers,  icon: Users,       color: (stats as any).pendingMembers > 0 ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600' },
  ] : []

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Community Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Edit community info and manage rules</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-lg', color)}>
                  <Icon size={16} />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Settings form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 size={20} className="text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Community Identity</h3>
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Community Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted">
                {logoUrl ? (
                  <img src={logoUrl} alt="Community logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 size={24} className="text-muted-foreground" />
                )}
              </div>
              <label className={cn(
                'flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors',
                uploading && 'opacity-60 pointer-events-none'
              )}>
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                {uploading ? 'Uploading…' : 'Upload Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Community Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Defence Housing Authority Phase 5"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Area</label>
              <input type="text" value={area} onChange={e => setArea(e.target.value)}
                placeholder="e.g. DHA Phase 5"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="e.g. Karachi"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Community Rules</label>
            <textarea
              value={rules}
              onChange={e => setRules(e.target.value)}
              rows={6}
              placeholder={"1. Be respectful to all residents.\n2. No spam or advertising.\n3. Emergency posts go in Safety & Alerts.\n4. Marketplace listings must be accurate."}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors resize-none font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">Displayed to members when they join the community.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={update.isPending}
              className="gap-2 rounded-xl"
            >
              {update.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Changes
            </Button>
            {saved && <p className="text-sm font-medium text-green-600">✓ Saved successfully</p>}
          </div>
        </div>

        <InviteTools
          communityName={name || 'Mohalla Community'}
          area={area}
          city={city}
          editableMessage
          title="Admin Invite Tools"
          description="Customize the WhatsApp invitation and share a community join link with new members."
        />
      </div>
    </AdminLayout>
  )
}
