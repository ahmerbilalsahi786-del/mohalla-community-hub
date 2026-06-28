import { useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseGeocode } from '@/lib/geocode'

type LocationPickerProps = {
  onSelect: (lat: number, lng: number, address: string) => void
  initialLat?: number
  initialLng?: number
}

type LocationMarkerProps = {
  icon: L.DivIcon
  onSelect: (lat: number, lng: number, address: string) => void
}

function LocationMarker({ icon, onSelect }: LocationMarkerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null)

  useMapEvents({
    click: async (event) => {
      const { lat, lng } = event.latlng
      setPosition([lat, lng])
      const address = await reverseGeocode(lat, lng)
      onSelect(lat, lng, address)
    },
  })

  return position ? <Marker icon={icon} position={position} /> : null
}

export default function LocationPicker({
  onSelect,
  initialLat = 31.5204,
  initialLng = 74.3587,
}: LocationPickerProps) {
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<div style="height:28px;width:28px;border-radius:999px;background:#16a34a;border:3px solid white;box-shadow:0 10px 24px rgba(15,23,42,.28);"></div>',
        iconAnchor: [14, 14],
        iconSize: [28, 28],
      }),
    [],
  )

  return (
    <div className="h-[250px] overflow-hidden rounded-xl border border-border bg-muted">
      <MapContainer
        center={[initialLat, initialLng]}
        className="h-full w-full"
        scrollWheelZoom
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker icon={markerIcon} onSelect={onSelect} />
      </MapContainer>
    </div>
  )
}
