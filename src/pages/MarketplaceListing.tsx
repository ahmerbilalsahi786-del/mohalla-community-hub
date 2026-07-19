import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { getListListingsQueryKey } from '@/lib/generated/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import {
  ArrowLeft, MessageCircle, CheckCircle2, Clock, Package,
  Loader2, MapPin, Share2, Trash2, Store
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { canManageCommunity, useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { customFetch } from '@/lib/custom-fetch'
import { UserAvatar } from '@/components/community/user-avatar'
import { SmartImageGallery } from '@/components/shared/SmartImageGrid'

const CONDITION_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: 'bg-emerald-500/10', text: 'text-emerald-700' },
  good: { label: 'Good', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  fair: { label: 'Fair', bg: 'bg-amber-500/10', text: 'text-amber-700' },
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; bg: string; text: string }> = {
  available: { label: 'Available', icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-700' },
  reserved: { label: 'Reserved', icon: Clock, bg: 'bg-amber-500/10', text: 'text-amber-700' },
  sold: { label: 'Sold', icon: CheckCircle2, bg: 'bg-muted', text: 'text-muted-foreground' },
}

const CATEGORY_LABELS: Record<string, string> = {
  shop: 'Shop',
  furniture: 'Furniture', electronics: 'Electronics', clothes: 'Clothes',
  vehicles: 'Vehicles', services: 'Services', free: 'Free', other: 'Other',
}

type Listing = {
  id: string | number
  userId: string
  userName: string
  unitNumber: string
  avatarUrl?: string | null
  title: string
  description: string
  pricePkr?: number | null
  category: string
  imageUrls?: string[]
  condition: string
  status: string
  whatsappNumber: string
  createdAt: string
  listingKind?: string
  location?: string | null
  latitude?: number | null
  longitude?: number | null
}

function formatPrice(pkr: number | null | undefined) {
  if (pkr === null || pkr === undefined) return 'Free'
  return `Rs ${pkr.toLocaleString()}`
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function buildWhatsAppUrl(number: string, title: string) {
  const cleaned = number.replace(/\D/g, '')
  const full = cleaned.startsWith('92') ? cleaned : `92${cleaned.replace(/^0/, '')}`
  const text = encodeURIComponent(`Hi, I saw your listing on Mohalla for ${title}. Is it still available?`)
  return `https://wa.me/${full}?text=${text}`
}

interface Props {
  params: { id: string }
}

export default function MarketplaceListing({ params }: Props) {
  const listingId = params.id
  const queryClient = useQueryClient()
  const [, navigate] = useLocation()
  const { data: user } = useCurrentUser()
  const { toast } = useToast()
  const [statusLoading, setStatusLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['/api/marketplace', listingId],
    queryFn: () => customFetch<Listing>(`/api/marketplace/${encodeURIComponent(listingId)}`, { method: 'GET' }),
    enabled: Boolean(listingId),
  })
  const isShop = listing?.listingKind === 'shop' || listing?.category === 'shop'
  const { data: shopListingsData } = useQuery({
    queryKey: ['/api/marketplace/shop-items', listing?.userId, listing?.id],
    queryFn: () => customFetch<{ listings: Listing[] }>(`/api/marketplace?limit=12&sellerId=${encodeURIComponent(String(listing?.userId ?? ''))}`, { method: 'GET' }),
    enabled: Boolean(isShop && listing?.userId),
    select: (data) => ({
      listings: (data.listings ?? []).filter((item) => String(item.userId) === String(listing?.userId) && String(item.id) !== String(listing?.id)),
    }),
  })

  if (isLoading) {
    return (
      <div className="portal-shell flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <TopNavbar />
          <main className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
              <div className="aspect-video bg-muted rounded-2xl" />
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="portal-shell flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <TopNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package size={48} className="text-muted-foreground/30 mx-auto mb-3" />
              <h2 className="font-semibold text-foreground">Listing not found</h2>
              <Link href="/marketplace">
                <Button className="mt-4 rounded-xl">Back to Marketplace</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const images = listing.imageUrls ?? []
  const cond = CONDITION_BADGE[listing.condition] || CONDITION_BADGE.good
  const statusCfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.available
  const StatusIcon = statusCfg.icon
  const canManageListing = listing.userId === user?.userId || canManageCommunity(user?.role)
  const isSold = listing.status === 'sold'
  const shopItems = shopListingsData?.listings ?? []

  const updateStatus = async (status: 'sold' | 'reserved' | 'available') => {
    setStatusLoading(true)
    try {
      await customFetch(`/api/marketplace/${encodeURIComponent(String(listing.id))}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() })
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace', listingId] })
    } catch (error) {
      toast({
        title: 'Could not update listing.',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleMarkSold = () => updateStatus('sold')
  const handleMarkReserved = () => updateStatus('reserved')
  const handleMarkAvailable = () => updateStatus('available')
  const handleDelete = async () => {
    const kind = listing.listingKind === 'shop' || listing.category === 'shop' ? 'shop' : 'listing'
    if (!window.confirm(`Delete ${kind} "${listing.title}"?`)) return

    setDeleteLoading(true)
    try {
      await customFetch(`/api/marketplace/${encodeURIComponent(String(listing.id))}`, { method: 'DELETE' })
      queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() })
      toast({ title: kind === 'shop' ? 'Shop deleted.' : 'Listing deleted.' })
      navigate('/marketplace')
    } catch (error) {
      toast({
        title: kind === 'shop' ? 'Could not delete shop.' : 'Could not delete listing.',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="portal-shell flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto p-3 pb-24 sm:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Back */}
            <Link href="/marketplace">
              <button className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={16} />
                Back to Marketplace
              </button>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: images */}
              <div className="space-y-3">
                {images.length > 0 ? (
                  <div className="relative">
                    <SmartImageGallery
                      images={images}
                      title={listing.title}
                      maxVisible={5}
                      className="rounded-2xl"
                    />
                    {isSold && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                        <span className="rounded-xl bg-black/70 px-4 py-2 text-lg font-bold text-white">SOLD</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/50">
                    <div className="w-full h-full flex items-center justify-center">
                      {isShop ? <Store size={64} className="text-muted-foreground/20" /> : <Package size={64} className="text-muted-foreground/20" />}
                    </div>

                    {isSold && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="rounded-xl bg-black/70 px-4 py-2 text-lg font-bold text-white">SOLD</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: details */}
              <div className="space-y-4">
                {/* Title + status */}
                <div>
                  <div className="flex items-start gap-2 flex-wrap mb-2">
                    <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', statusCfg.bg, statusCfg.text)}>
                      <StatusIcon size={12} />
                      {statusCfg.label}
                    </span>
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', cond.bg, cond.text)}>
                      {cond.label}
                    </span>
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-muted text-muted-foreground">
                      {CATEGORY_LABELS[listing.category] || listing.category}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground leading-tight">{listing.title}</h1>
                </div>

                {/* Price */}
                {!isShop && (
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(listing.pricePkr)}
                  </p>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
                </div>

                {/* Seller info */}
                <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{isShop ? 'Shop contact' : 'Seller'}</h3>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={listing.userName} src={listing.avatarUrl} className="h-10 w-10" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{listing.userName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={11} />
                        <span>{listing.unitNumber}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Listed {timeAgo(listing.createdAt)}</p>
                </div>

                {/* CTA buttons */}
                <div className="space-y-2">
                  {!isSold && (
                    <a
                      href={buildWhatsAppUrl(listing.whatsappNumber, listing.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
                    >
                      <MessageCircle size={18} />
                      {isShop ? 'Message Shop on WhatsApp' : 'Contact on WhatsApp'}
                    </a>
                  )}

                  {/* Share via WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(isShop ? `Check out this shop on Mohalla: "${listing.title}" (${listing.location || listing.unitNumber}). Open the Mohalla app for details.` : `Check out this listing on Mohalla: "${listing.title}" – ${listing.pricePkr ? `Rs ${listing.pricePkr.toLocaleString()}` : 'Free'} (${listing.unitNumber}). Open the Mohalla app for details.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Share2 size={15} />
                    Share via WhatsApp
                  </a>
                

                  {canManageListing && !isSold && !isShop && (
                    <div className="flex gap-2">
                      {listing.status !== 'reserved' && (
                        <button
                          onClick={handleMarkReserved}
                          disabled={statusLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                        >
                          <Clock size={15} />
                          Mark Reserved
                        </button>
                      )}
                      <button
                        onClick={handleMarkSold}
                        disabled={statusLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} />
                        Mark Sold
                      </button>
                    </div>
                  )}

                  {canManageListing && listing.status !== 'available' && !isShop && (
                    <button
                      onClick={handleMarkAvailable}
                      disabled={statusLoading}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      Mark Available Again
                    </button>
                  )}

                  {canManageListing && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/10 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                    >
                      {deleteLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      Delete {listing.listingKind === 'shop' || listing.category === 'shop' ? 'Shop' : 'Listing'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isShop && (
              <section className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Listed items</h2>
                    <p className="text-sm text-muted-foreground">Items and services shared by this shop.</p>
                  </div>
                  <Link href="/marketplace?create=listing">
                    <Button variant="outline" size="sm" className="rounded-xl">Post item</Button>
                  </Link>
                </div>
                {shopItems.length === 0 ? (
                  <p className="rounded-xl bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                    This shop has not listed items yet.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {shopItems.map((item) => (
                      <Link key={item.id} href={`/marketplace/${item.id}`} className="rounded-xl border border-border bg-background/70 p-3 transition-colors hover:bg-muted/50">
                        <p className="line-clamp-1 text-sm font-bold text-foreground">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                        <p className="mt-2 text-sm font-bold text-primary">{formatPrice(item.pricePkr)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
