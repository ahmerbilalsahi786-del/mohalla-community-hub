import { lookupLocationFromCoordinates } from './_reverse-geocode.js'

function sendJson(response, status, body) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return sendJson(response, 405, { error: 'Method not allowed.' })
  }

  const baseUrl = `https://${request.headers.host || 'localhost'}`
  const url = new URL(request.url || '/api/reverse-geocode', baseUrl)
  const latitude = Number(url.searchParams.get('latitude'))
  const longitude = Number(url.searchParams.get('longitude'))

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return sendJson(response, 400, { error: 'Latitude and longitude are required.' })
  }

  try {
    const location = await lookupLocationFromCoordinates(latitude, longitude)
    return sendJson(response, 200, location)
  } catch (error) {
    return sendJson(response, 502, {
      error: error instanceof Error ? error.message : 'Could not read your location details right now.',
    })
  }
}
