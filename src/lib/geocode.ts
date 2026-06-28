export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const token = import.meta.env.VITE_LOCATIONIQ_TOKEN?.trim()
    if (!token) {
      throw new Error('Missing VITE_LOCATIONIQ_TOKEN')
    }

    const url = new URL('https://us1.locationiq.com/v1/reverse')
    url.searchParams.set('key', token)
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('format', 'json')

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()
    return typeof data?.display_name === 'string' ? data.display_name : ''
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
