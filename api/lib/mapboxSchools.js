const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoiaGVpc29sbHkiLCJhIjoiY21wc3Z0ang5MG5ybzJxcjF6djk0MDZiayJ9.SmwYAfMPqsJnD8snIKMz1Q'

const EDUCATION_RE = /(university|college|school|polytechnic|campus|institute|academy|faculty)/i

function getToken(env = {}) {
  return env.MAPBOX_PUBLIC_TOKEN || env.VITE_MAPBOX_PUBLIC_TOKEN || env.MAPBOX_TOKEN || DEFAULT_MAPBOX_TOKEN
}

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function bboxFromRadius(latitude, longitude, radiusKm) {
  if (latitude == null || longitude == null || !radiusKm) return null
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.15))
  return [
    longitude - lngDelta,
    latitude - latDelta,
    longitude + lngDelta,
    latitude + latDelta,
  ].join(',')
}

function cleanFeature(feature, origin) {
  const [lng, lat] = feature.center || feature.geometry?.coordinates || []
  const name = feature.text || feature.place_name?.split(',')[0] || ''
  const placeName = feature.place_name || name
  const haystack = `${name} ${placeName} ${feature.properties?.category || ''}`
  if (!name || !EDUCATION_RE.test(haystack)) return null

  const distance = origin?.latitude && origin?.longitude && lat && lng
    ? distanceKm(origin.latitude, origin.longitude, lat, lng)
    : null

  return {
    id: feature.id || `${name}-${lat}-${lng}`,
    name,
    address: placeName.replace(`${name},`, '').trim() || placeName,
    placeName,
    latitude: lat,
    longitude: lng,
    distanceKm: distance == null ? null : Number(distance.toFixed(1)),
  }
}

async function fetchGeocode({ token, query, latitude, longitude, radiusKm, limit = 8 }) {
  const params = new URLSearchParams({
    access_token: token,
    autocomplete: 'true',
    limit: String(limit),
    types: 'poi',
  })

  if (latitude != null && longitude != null) {
    params.set('proximity', `${longitude},${latitude}`)
    const bbox = bboxFromRadius(latitude, longitude, radiusKm)
    if (bbox) params.set('bbox', bbox)
  }

  const encoded = encodeURIComponent(query)
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params}`)
  if (!response.ok) throw new Error(`Mapbox search failed with ${response.status}`)
  return response.json()
}

function uniqueSchools(features, origin, radiusKm, query) {
  const seen = new Set()
  const hasQuery = Boolean(String(query || '').trim())
  return features
    .map((feature) => cleanFeature(feature, origin))
    .filter(Boolean)
    .filter((school) => {
      const key = `${school.name.toLowerCase()}-${school.latitude}-${school.longitude}`
      if (seen.has(key)) return false
      seen.add(key)
      if (hasQuery || school.distanceKm == null || !radiusKm) return true
      return school.distanceKm <= radiusKm
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name)
      if (a.distanceKm == null) return 1
      if (b.distanceKm == null) return -1
      return a.distanceKm - b.distanceKm
    })
}

export async function runMapboxSchoolSearch(input = {}, env = {}) {
  const token = getToken(env)
  const latitude = toNumber(input.latitude)
  const longitude = toNumber(input.longitude)
  const radiusKm = toNumber(input.radiusKm) || 120
  const query = String(input.query || '').trim()
  const origin = latitude != null && longitude != null ? { latitude, longitude } : null

  const queries = query
    ? [query, `${query} university`, `${query} college`, `${query} school`]
    : ['university', 'college', 'polytechnic', 'campus']

  const results = await Promise.all(
    queries.map((term) => fetchGeocode({
      token,
      query: term,
      latitude,
      longitude,
      radiusKm: query ? null : radiusKm,
      limit: query ? 10 : 7,
    }))
  )

  const features = results.flatMap((result) => result.features || [])
  const schools = uniqueSchools(features, origin, radiusKm, query).slice(0, 12)

  return {
    ok: true,
    schools,
    mode: origin ? 'nearby' : 'search',
  }
}
