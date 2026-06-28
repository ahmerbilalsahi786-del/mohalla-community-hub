export function lookupLocationFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<{
  area: string
  city: string
}>
