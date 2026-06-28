import { useEffect, useMemo, useState } from 'react'
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode, searchAddress, type AddressSearchResult } from '@/lib/geocode'
import { cn } from '@/lib/utils'

export type PickedLocation = {
  latitude: number
  longitude: number
  address: string
}

type LocationPickerProps = {
  onSelect: (data: PickedLocation) => void
  initialLat?: number | null
  initialLng?: number | null
  compact?: boolean
}

const DEFAULT_CENTER: [number, number] = [31.5204, 74.3587]

const markerIcon = L.divIcon({
  className: '',
  html: '<div class="flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [center, map])

  return null
}

export default function LocationPicker({
  onSelect,
  initialLat,
  initialLng,
  compact = false,
}: LocationPickerProps) {
  const initialPosition = typeof initialLat === 'number' && Number.isFinite(initialLat) && typeof initialLng === 'number' && Number.isFinite(initialLng)
    ? [initialLat, initialLng] as [number, number]
    : null
  const [position, setPosition] = useState<[number, number] | null>(initialPosition)
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const center = useMemo(() => position ?? DEFAULT_CENTER, [position])

  const handlePick = async (lat: number, lng: number, knownAddress?: string) => {
    setPosition([lat, lng])
    setLoading(true)
    const resolvedAddress = knownAddress ?? await reverseGeocode(lat, lng)
    setAddress(resolvedAddress)
    setSearchQuery(resolvedAddress || searchQuery)
    setLoading(false)
    onSelect({ latitude: lat, longitude: lng, address: resolvedAddress })
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => void handlePick(pos.coords.latitude, pos.coords.longitude),
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
    )
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    const results = await searchAddress(searchQuery)
    setSearchResults(results)
    setLoading(false)
  }

  const selectSearchResult = (result: AddressSearchResult) => {
    setSearchResults([])
    void handlePick(result.lat, result.lng, result.address)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search address or nearby landmark"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSearch()
              }
            }}
            className="h-10 w-full rounded-xl border border-border bg-muted/30 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={loading || !searchQuery.trim()}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
          </button>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Crosshair size={14} />
            GPS
          </button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-card shadow-sm">
          {searchResults.map((result) => (
            <button
              key={`${result.lat}-${result.lng}-${result.address}`}
              type="button"
              onClick={() => selectSearchResult(result)}
              className="block w-full border-b border-border px-3 py-2 text-left text-sm text-foreground transition-colors last:border-0 hover:bg-muted"
            >
              {result.address}
            </button>
          ))}
        </div>
      )}

      <div className={cn('overflow-hidden rounded-xl border border-border', compact ? 'h-48' : 'h-64')}>
        <MapContainer center={center} zoom={13} className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={(lat, lng) => void handlePick(lat, lng)} />
          <RecenterMap center={center} />
          {position && <Marker position={position} icon={markerIcon} />}
        </MapContainer>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin size={13} className="mt-0.5 shrink-0" />
        <span>{loading ? 'Getting address...' : address || 'Optional: click the map, search, or use GPS to tag this location.'}</span>
      </p>
    </div>
  )
}
