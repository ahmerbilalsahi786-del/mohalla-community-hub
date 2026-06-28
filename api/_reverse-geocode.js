const LOOKUP_TIMEOUT_MS = 8000

function firstNonEmpty(values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''
}

function normalizeLocation(payload) {
  const address = payload?.address ?? {}

  return {
    area: firstNonEmpty([
      payload?.area,
      payload?.locality,
      payload?.district,
      payload?.suburb,
      address?.suburb,
      address?.neighbourhood,
      address?.residential,
      address?.quarter,
      address?.city_district,
      address?.township,
      address?.road,
    ]),
    city: firstNonEmpty([
      payload?.city,
      payload?.principalSubdivision,
      payload?.locality,
      payload?.county,
      address?.city,
      address?.town,
      address?.county,
      address?.state_district,
      address?.village,
    ]),
  }
}

async function fetchJson(url, init = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Lookup request failed with status ${response.status}.`)
    }

    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

export async function lookupLocationFromCoordinates(latitude, longitude) {
  const providers = [
    {
      url: `https://api-bdc.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}&localityLanguage=en`,
      init: {
        headers: {
          Accept: 'application/json',
        },
      },
    },
    {
      url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}&zoom=15&addressdetails=1`,
      init: {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MohallaCommunity/1.0 (support@mohalla.app)',
        },
      },
    },
  ]

  let lastError = null
  for (const provider of providers) {
    try {
      const payload = await fetchJson(provider.url, provider.init)
      const location = normalizeLocation(payload)
      if (location.area || location.city) return location
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Reverse geocoding failed.')
    }
  }

  throw lastError ?? new Error('Could not read your location details right now.')
}
