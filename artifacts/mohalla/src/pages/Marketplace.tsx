import { useState, useRef } from 'react'
import { Link } from 'wouter'
import { useListListings, useCreateListing, getListListingsQueryKey } from '@workspace/api-client-react'
import { useUpload } from '@workspace/object-storage-web'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavbar } from '@/components/dashboard/top-navbar'
import {
  Plus, X, Search, Loader2, ChevronDown, ChevronUp,
  Armchair, Tv2, Shirt, Car, Wrench, Gift, Package,
  Tag, CheckCircle2, Clock, Image as ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Category = 'all' | 'furniture' | 'electronics' | 'clothes' | 'vehicles' | 'services' | 'free' | 'other'
type Condition = 'new' | 'good' | 'fair'

const CATEGORIES: { value: Category; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Package },
  { value: 'furniture', label: 'Furniture', icon: Armchair },
  { value: 'electronics', label: 'Electronics', icon: Tv2 },
  { value: 'clothes', label: 'Clothes', icon: Shirt },
  { value: 'vehicles', label: 'Vehicles', icon: Car },
  { value: 'services', label: 'Services', icon: Wrench },
  { value: 'free', label: 'Free', icon: Gift },
  { value: 'other', label: 'Other', icon: Package },
]

const CONDITION_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  new: { label: 'New', bg: 'bg-emerald-500/10', text: 'text-emerald-700' },
  good: { label: 'Good', bg: 'bg-blue-500/10', text: 'text-blue-600' },
  fair: { label: 'Fair', bg: 'bg-amber-500/10', text: 'text-amber-700' },
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  available: { label: 'Available', bg: 'bg-emerald-500/10', text: 'text-emerald-700' },
  sold: { label: 'Sold', bg: 'bg-muted', text: 'text-muted-foreground' },
  reserved: { label: 'Reserved', bg: 'bg-amber-500/10', text: 'text-amber-700' },
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

interface Listing {
  id: number
  userId: string
  userName: string
  unitNumber: string
  title: string
  description: string
  pricePkr?: number | null
  category: string
  imageUrls: string[]
  condition: string
  status: string
  whatsappNumber: string
  createdAt: string
}

function ListingCard({ listing }: { listing: Listing }) {
  const cond = CONDITION_BADGE[listing.condition] || CONDITION_BADGE.good
  const status = STATUS_BADGE[listing.status] || STATUS_BADGE.available
  const isSold = listing.status !== 'available'

  return (
    <Link href={`/marketplace/${listing.id}`}>
      <div className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer',
        isSold && 'opacity-60'
      )}>
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted/50 overflow-hidden">
          {listing.imageUrls.length > 0 ? (
            <img
              src={listing.imageUrls[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={40} className="text-muted-foreground/30" />
            </div>
          )}
          {isSold && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className={cn('rounded-full px-3 py-1 text-sm font-bold', status.bg, status.text)}>
                {status.label}
              </span>
            </div>
          )}
          {listing.imageUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
              +{listing.imageUrls.length - 1}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 flex-1">
              {listing.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', cond.bg, cond.text)}>
              {cond.label}
            </span>
          </div>

          <p className="text-base font-bold text-primary mt-auto">
            {formatPrice(listing.pricePkr)}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{listing.unitNumber}</span>
            <span>{timeAgo(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function CreateListingModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pricePkr, setPricePkr] = useState('')
  const [category, setCategory] = useState<Exclude<Category, 'all'>>('other')
  const [condition, setCondition] = useState<Condition>('good')
  const [whatsapp, setWhatsapp] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { uploadFile, isUploading } = useUpload({
    requestUploadUrl: '/api/storage/uploads/request-url',
  })

  const createListing = useCreateListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() })
        onClose()
      },
    },
  })

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    const remaining = 4 - imageUrls.length
    const toUpload = Array.from(files).slice(0, remaining)
    for (const file of toUpload) {
      const result = await uploadFile(file)
      if (result) setImageUrls((prev) => [...prev, `/api/storage${result.objectPath}`])
    }
  }

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !whatsapp.trim()) return
    createListing.mutate({
      data: {
        title: title.trim(),
        description: description.trim(),
        pricePkr: pricePkr ? parseInt(pricePkr, 10) : undefined,
        category,
        condition,
        imageUrls,
        whatsappNumber: whatsapp.trim(),
      },
    })
  }

  const catOptions: { value: Exclude<Category, 'all'>; label: string }[] = [
    { value: 'furniture', label: 'Furniture' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothes', label: 'Clothes' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'services', label: 'Services' },
    { value: 'free', label: 'Free' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Add Listing</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {catOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={cn(
                    'rounded-xl py-2 text-xs font-medium border transition-all',
                    category === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Title</label>
            <input
              type="text"
              placeholder="What are you selling?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
            <textarea
              placeholder="Describe the item..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Price + Condition row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Price (PKR)</label>
              <input
                type="number"
                placeholder="Leave empty if free"
                value={pricePkr}
                onChange={(e) => setPricePkr(e.target.value)}
                min={0}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">WhatsApp Number</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium shrink-0">+92</span>
              <input
                type="tel"
                placeholder="3001234567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Photos ({imageUrls.length}/4)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {imageUrls.length < 4 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                ) : (
                  <><ImageIcon size={16} /> Add photos from device</>
                )}
              </button>
            )}
            {imageUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                    <button
                      onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20 shrink-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || !whatsapp.trim() || createListing.isPending || isUploading}
            className="rounded-xl bg-primary text-primary-foreground"
          >
            {createListing.isPending ? 'Posting...' : 'List Item'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [page, setPage] = useState(1)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearchChange = (val: string) => {
    setSearch(val)
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 350)
  }

  const { data, isLoading, isFetching } = useListListings({
    communityId: 'default',
    category: activeCategory === 'all' ? undefined : activeCategory,
    search: debouncedSearch || undefined,
    minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
    page,
    limit: 24,
  })

  const listings = data?.listings ?? []
  const hasMore = data?.hasMore ?? false

  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat)
    setPage(1)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopNavbar />

        <main className="flex-1 overflow-y-auto">
          {/* Search + filters bar */}
          <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-6 py-3 space-y-3">
            {/* Search row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search listings..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary focus:bg-background transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors shrink-0',
                  showFilters || minPrice || maxPrice
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                <Tag size={14} />
                Price
                {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Price filter */}
            {showFilters && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Min PKR"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
                    min={0}
                    className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <span className="text-muted-foreground text-sm">–</span>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max PKR"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
                    min={0}
                    className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                {(minPrice || maxPrice) && (
                  <button
                    onClick={() => { setMinPrice(''); setMaxPrice(''); setPage(1) }}
                    className="text-sm text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all shrink-0',
                      activeCategory === cat.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon size={13} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-6 pb-24">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card animate-pulse">
                    <div className="aspect-[4/3] bg-muted rounded-t-2xl" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-5 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <Package size={32} className="text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {debouncedSearch || activeCategory !== 'all' || minPrice || maxPrice
                    ? 'No listings found'
                    : 'No listings yet.'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {debouncedSearch || activeCategory !== 'all' || minPrice || maxPrice
                    ? 'Try different filters'
                    : 'Have something to sell?'}
                </p>
                <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl bg-primary">
                  <Plus size={16} className="mr-2" />
                  Add Listing
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">{data?.total ?? 0} listings</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {listings.map((l) => (
                    <ListingCard key={l.id} listing={l as any} />
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                    className="mt-6 w-full rounded-xl border border-border bg-card py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {isFetching ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {showCreate && <CreateListingModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
