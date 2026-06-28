export type ReverseGeocodeResult = {
  address: string
  area: string
  city: string
}

function pickAddressParts(payload: any): ReverseGeocodeResult {
  const address = payload?.address ?? {}
  const displayName = typeof payload?.display_name === 'string' ? payload.display_name : ''
  const area = String(
    payload?.area ||
    payload?.locality ||
    payload?.district ||
    payload?.suburb ||
    payload?.principalSubdivision ||
    address.suburb ||
    address.neighbourhood ||
    address.residential ||
    address.quarter ||
    address.city_district ||
    address.township ||
    address.road ||
    address.village ||
    '',
  ).trim()
  const city = String(
    payload?.city ||
    payload?.locality ||
    payload?.principalSubdivision ||
    payload?.county ||
    address.city ||
    address.town ||
    address.municipality ||
    address.county ||
    address.state_district ||
    address.state ||
    '',
  ).trim()

  return {
    address: displayName || [area, city].filter(Boolean).join(', '),
    area,
    city,
  }
}

async function fetchFallbackReverse(lat: number, lng: number) {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('localityLanguage', 'en')

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error('Fallback geocoding failed')
  }

  return response.json()
}

async function fetchLocationIqReverse(lat: number, lng: number) {
  const token = import.meta.env.VITE_LOCATIONIQ_TOKEN?.trim()
  if (!token) {
    return fetchFallbackReverse(lat, lng)
  }

  const url = new URL('https://us1.locationiq.com/v1/reverse')
  url.searchParams.set('key', token)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')

  const response = await fetch(url.toString())
  if (!response.ok) {
    return fetchFallbackReverse(lat, lng)
  }

  return response.json()
}

export async function reverseGeocodeParts(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const data = await fetchLocationIqReverse(lat, lng)
  return pickAddressParts(data)
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const result = await reverseGeocodeParts(lat, lng)
    return result.address
  } catch (error) {
    console.error('Reverse geocode error:', error)
    return ''
  }
}

export type AddressSearchResult = {
  lat: number
  lng: number
  address: string
}

export async function searchAddress(query: string): Promise<AddressSearchResult[]> {
  try {
    const token = import.meta.env.VITE_LOCATIONIQ_TOKEN?.trim()
    if (!token) {
      throw new Error('Missing VITE_LOCATIONIQ_TOKEN')
    }

    const trimmed = query.trim()
    if (!trimmed) return []

    const url = new URL('https://us1.locationiq.com/v1/search')
    url.searchParams.set('key', token)
    url.searchParams.set('q', trimmed)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '5')

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error('Address search failed')
    }

    const data = await response.json()
    if (!Array.isArray(data)) return []

    return data
      .map((item) => ({
        lat: Number.parseFloat(String(item?.lat ?? '')),
        lng: Number.parseFloat(String(item?.lon ?? '')),
        address: String(item?.display_name ?? ''),
      }))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && item.address)
  } catch (error) {
    console.error('Address search error:', error)
    return []
  }
}
