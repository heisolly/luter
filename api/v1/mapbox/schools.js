import { runMapboxSchoolSearch } from '../../lib/mapboxSchools.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
    return
  }

  try {
    const url = new URL(req.url || '/', 'http://luter.local')
    const out = await runMapboxSchoolSearch({
      query: url.searchParams.get('q') || '',
      latitude: url.searchParams.get('lat'),
      longitude: url.searchParams.get('lng'),
      radiusKm: url.searchParams.get('radiusKm'),
    }, process.env)
    res.statusCode = 200
    res.end(JSON.stringify(out))
  } catch (error) {
    res.statusCode = 500
    res.end(JSON.stringify({ ok: false, error: String(error?.message || error), schools: [] }))
  }
}
