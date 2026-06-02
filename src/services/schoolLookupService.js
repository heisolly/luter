const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGVpc29sbHkiLCJhIjoiY21wc3Z0ang5MG5ybzJxcjF6djk0MDZiayJ9.SmwYAfMPqsJnD8snIKMz1Q';
const EDUCATION_RE = /(university|college|school|polytechnic|campus|institute|academy|faculty|univ)/i;

export function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location is not available in this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 1000 * 60 * 20 },
    )
  })
}

function distanceKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bboxFromRadius(latitude, longitude, radiusKm) {
  if (latitude == null || longitude == null || !radiusKm) return null;
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.15));
  return [
    longitude - lngDelta,
    latitude - latDelta,
    longitude + lngDelta,
    latitude + latDelta,
  ].join(',');
}

function cleanFeature(feature, origin) {
  const [lng, lat] = feature.center || feature.geometry?.coordinates || [];
  const name = feature.text || feature.place_name?.split(',')[0] || '';
  const placeName = feature.place_name || name;
  const haystack = `${name} ${placeName} ${feature.properties?.category || ''}`;
  
  // Don't filter by education regex - show all results and let user choose
  if (!name) return null;

  const distance = origin?.latitude && origin?.longitude && lat && lng
    ? distanceKm(origin.latitude, origin.longitude, lat, lng)
    : null;

  return {
    id: feature.id || `${name}-${lat}-${lng}`,
    name,
    address: placeName.replace(`${name},`, '').trim() || placeName,
    placeName,
    latitude: lat,
    longitude: lng,
    distanceKm: distance == null ? null : Number(distance.toFixed(1)),
  };
}

async function fetchGeocode({ query, latitude, longitude, radiusKm, limit = 8 }) {
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    autocomplete: 'true',
    limit: String(limit),
    types: 'poi,place',
  });

  if (latitude != null && longitude != null) {
    params.set('proximity', `${longitude},${latitude}`);
    const bbox = bboxFromRadius(latitude, longitude, radiusKm);
    if (bbox) params.set('bbox', bbox);
  }

  const encoded = encodeURIComponent(query);
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?${params}`);
  if (!response.ok) throw new Error(`Mapbox search failed with ${response.status}`);
  return response.json();
}

export async function searchSchools({ query = '', latitude, longitude, radiusKm = 200 } = {}) {
  const origin = latitude != null && longitude != null ? { latitude, longitude } : null;
  const term = query.trim();

  const queries = term
    ? [term, `${term} university`, `${term} college`, `${term} school`, `${term} polytechnic`]
    : ['university', 'college', 'polytechnic', 'campus', 'institute', 'academy'];

  // Use allSettled so a single Mapbox failure doesn't break the whole flow.
  const settled = await Promise.allSettled(
    queries.map((q) => fetchGeocode({
      query: q,
      latitude,
      longitude,
      radiusKm: term ? null : radiusKm,
      limit: term ? 15 : 10,
    }))
  );

  const results = settled
    .filter((r) => r.status === 'fulfilled' && r.value && Array.isArray(r.value.features))
    .map((r) => r.value);

  const features = results.flatMap((result) => result.features || []);
  const seen = new Set();

  const schools = features
    .map((feature) => cleanFeature(feature, origin))
    .filter(Boolean)
    .filter((school) => {
      const key = `${school.name.toLowerCase()}-${school.latitude}-${school.longitude}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (term || school.distanceKm == null || !radiusKm) return true;
      return school.distanceKm <= radiusKm;
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return a.name.localeCompare(b.name);
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, 15);

  return schools;
}
