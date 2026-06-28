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
