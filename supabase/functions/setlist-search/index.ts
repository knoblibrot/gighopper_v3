// Finds artists on setlist.fm, then an artist's shows in Germany. Every show
// found is stored as reference data, so the client can attach attendances by
// our own ids.
//
// Secrets (supabase secrets set ...): SETLISTFM_API_KEY, ALLOWED_ORIGINS.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
// The gateway rejects requests without a valid JWT (verify_jwt is on); the
// handler additionally requires that JWT to belong to a signed-in user.

import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  parseArtists,
  parseSetlist,
  uniqueBy,
  type ParsedEvent,
  type SetlistFmArtistSearchResponse,
  type SetlistFmSearchResponse,
} from '../_shared/setlistfm.ts'

const ARTISTS_URL = 'https://api.setlist.fm/rest/1.0/search/artists'
const SETLISTS_URL = 'https://api.setlist.fm/rest/1.0/search/setlists'
const MAX_ARTISTS = 10
const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173').split(',').map((o) => o.trim())

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
})

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })
}

// A network failure becomes a 502 response, so the client sees an error with
// CORS headers instead of a CORS block.
async function setlistfm(endpoint: string, params: Record<string, string>): Promise<Response> {
  const url = new URL(endpoint)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'de',
        'x-api-key': Deno.env.get('SETLISTFM_API_KEY')!,
      },
    })
  } catch (error) {
    console.error('setlist.fm unreachable', error)
    return new Response(null, { status: 502 })
  }
}

function upstreamError(response: Response, headers: HeadersInit): Response {
  if (response.status === 429) return json({ error: 'rate_limited' }, 429, headers)
  return json({ error: 'upstream_error' }, 502, headers)
}

async function store(events: ParsedEvent[]) {
  const artists = uniqueBy(events.map((e) => e.artist), (a) => a.mbid)
  const { data: artistRows, error: artistError } = await db
    .from('artists')
    .upsert(artists.map((a) => ({ mbid: a.mbid, name: a.name })), { onConflict: 'mbid' })
    .select('id, mbid')
  if (artistError) throw artistError

  const cities = uniqueBy(events.map((e) => e.city), (c) => c.geonamesId)
  const { data: cityRows, error: cityError } = await db
    .from('cities')
    .upsert(
      cities.map((c) => ({
        geonames_id: c.geonamesId,
        name: c.name,
        country_code: c.countryCode,
        state_code: c.stateCode,
        lat: c.lat,
        lng: c.lng,
      })),
      { onConflict: 'geonames_id' },
    )
    .select('id, geonames_id')
  if (cityError) throw cityError

  const artistId = new Map(artistRows.map((r) => [r.mbid, r.id]))
  const cityId = new Map(cityRows.map((r) => [r.geonames_id, r.id]))

  const venues = uniqueBy(events, (e) => e.venue.setlistfmId)
  const { data: venueRows, error: venueError } = await db
    .from('venues')
    .upsert(
      venues.map((e) => ({ setlistfm_id: e.venue.setlistfmId, name: e.venue.name, city_id: cityId.get(e.city.geonamesId) })),
      { onConflict: 'setlistfm_id' },
    )
    .select('id, setlistfm_id')
  if (venueError) throw venueError

  const venueId = new Map(venueRows.map((r) => [r.setlistfm_id, r.id]))

  const { data: eventRows, error: eventError } = await db
    .from('events')
    .upsert(
      uniqueBy(events, (e) => e.setlistfmId).map((e) => ({
        setlistfm_id: e.setlistfmId,
        artist_id: artistId.get(e.artist.mbid),
        venue_id: venueId.get(e.venue.setlistfmId),
        date: e.date,
        tour_name: e.tourName,
        songs: e.songs,
        setlistfm_url: e.url,
      })),
      { onConflict: 'setlistfm_id' },
    )
    .select('id, setlistfm_id')
  if (eventError) throw eventError

  const eventId = new Map(eventRows.map((r) => [r.setlistfm_id, r.id]))

  return events.map((e) => ({
    id: eventId.get(e.setlistfmId)!,
    date: e.date,
    artistName: e.artist.name,
    venueName: e.venue.name,
    cityName: e.city.name,
    stateCode: e.city.stateCode,
  }))
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, headers)

  // verify_jwt only checks the signature, and the public anon key is itself a
  // valid JWT. Require a signed-in user, so nobody else spends our quota.
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const { data: auth } = token ? await db.auth.getUser(token) : { data: { user: null } }
  if (!auth.user) return json({ error: 'unauthorized' }, 401, headers)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, headers)
  }
  if (typeof body !== 'object' || body === null) return json({ error: 'invalid_json' }, 400, headers)

  // { artist } → artists to pick from. { mbid, page } → that artist's shows.
  // Searching shows by name would mix in similarly named artists.
  const { artist, mbid, page = 1 } = body
  if (mbid === undefined) {
    if (typeof artist !== 'string' || artist.trim().length < 2 || artist.length > 100) {
      return json({ error: 'invalid_artist' }, 400, headers)
    }
    const response = await setlistfm(ARTISTS_URL, { artistName: artist.trim(), sort: 'relevance' })
    // setlist.fm answers 404 when nothing matches.
    if (response.status === 404) return json({ artists: [] }, 200, headers)
    if (!response.ok) return upstreamError(response, headers)
    const artists = parseArtists((await response.json()) as SetlistFmArtistSearchResponse, artist)
    return json({ artists: artists.slice(0, MAX_ARTISTS) }, 200, headers)
  }

  if (typeof mbid !== 'string' || !MBID.test(mbid)) return json({ error: 'invalid_mbid' }, 400, headers)
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1 || page > 50) {
    return json({ error: 'invalid_page' }, 400, headers)
  }

  const response = await setlistfm(SETLISTS_URL, { artistMbid: mbid, countryCode: 'DE', p: String(page) })
  if (response.status === 404) return json({ total: 0, page, perPage: 20, events: [] }, 200, headers)
  if (!response.ok) return upstreamError(response, headers)

  const result = (await response.json()) as SetlistFmSearchResponse
  const parsed = (result.setlist ?? []).map(parseSetlist).filter((e): e is ParsedEvent => e !== null)

  try {
    const events = parsed.length > 0 ? await store(parsed) : []
    return json({ total: result.total, page: result.page, perPage: result.itemsPerPage, events }, 200, headers)
  } catch (error) {
    console.error('store failed', error)
    return json({ error: 'store_failed' }, 500, headers)
  }
})
