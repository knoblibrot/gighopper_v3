// Pure parsing of setlist.fm API responses. No Deno or network APIs here, so
// the same file runs in the edge function and in Vitest.

export type SetlistFmSetlist = {
  id: string
  eventDate: string // dd-MM-yyyy
  url?: string
  artist: { mbid: string; name: string }
  venue: {
    id: string
    name: string
    city: {
      id: string
      name: string
      stateCode?: string
      coords?: { lat?: number; long?: number }
      country: { code: string }
    }
  }
  tour?: { name?: string }
  sets?: { set?: Array<{ song?: Array<{ name?: string }> }> }
}

export type SetlistFmSearchResponse = {
  total: number
  page: number
  itemsPerPage: number
  setlist?: SetlistFmSetlist[]
}

export type ParsedEvent = {
  setlistfmId: string
  date: string // yyyy-MM-dd
  url: string | null
  tourName: string | null
  songs: string[]
  artist: { mbid: string; name: string }
  venue: { setlistfmId: string; name: string }
  city: {
    geonamesId: string
    name: string
    countryCode: string
    stateCode: string | null
    lat: number | null
    lng: number | null
  }
}

// GeoNames admin1 codes for Germany → the state codes the app uses.
const GERMAN_STATES: Record<string, string> = {
  '01': 'BW',
  '02': 'BY',
  '03': 'HB',
  '04': 'HH',
  '05': 'HE',
  '06': 'NI',
  '07': 'NW',
  '08': 'RP',
  '09': 'SL',
  '10': 'SH',
  '11': 'BB',
  '12': 'MV',
  '13': 'SN',
  '14': 'ST',
  '15': 'TH',
  '16': 'BE',
}

// We request German names from setlist.fm, but exonyms occasionally slip
// through. Keys are compared lower-case.
const GERMAN_CITY_NAMES: Record<string, string> = {
  munich: 'München',
  cologne: 'Köln',
  nuremberg: 'Nürnberg',
  hanover: 'Hannover',
  brunswick: 'Braunschweig',
}

export function germanStateCode(countryCode: string, admin1?: string): string | null {
  if (countryCode.toUpperCase() !== 'DE' || !admin1) return null
  // setlist.fm reports admin1 either bare ("02") or prefixed ("DE.02").
  const code = admin1.split('.').pop()!.padStart(2, '0')
  return GERMAN_STATES[code] ?? null
}

export function germanCityName(name: string): string {
  return GERMAN_CITY_NAMES[name.trim().toLowerCase()] ?? name.trim()
}

export function parseEventDate(eventDate: string): string | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(eventDate)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

export function parseSetlist(raw: SetlistFmSetlist): ParsedEvent | null {
  const date = parseEventDate(raw.eventDate)
  const city = raw.venue?.city
  if (!date || !raw.artist?.mbid || !raw.venue?.id || !city?.id) return null

  const songs = (raw.sets?.set ?? [])
    .flatMap((set) => set.song ?? [])
    .map((song) => song.name?.trim() ?? '')
    .filter((name) => name.length > 0)

  return {
    setlistfmId: raw.id,
    date,
    url: raw.url ?? null,
    tourName: raw.tour?.name?.trim() || null,
    songs,
    artist: { mbid: raw.artist.mbid, name: raw.artist.name.trim() },
    venue: { setlistfmId: raw.venue.id, name: raw.venue.name.trim() },
    city: {
      geonamesId: city.id,
      name: germanCityName(city.name),
      countryCode: city.country.code.toUpperCase(),
      stateCode: germanStateCode(city.country.code, city.stateCode),
      lat: city.coords?.lat ?? null,
      lng: city.coords?.long ?? null,
    },
  }
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Map<string, T>()
  for (const item of items) seen.set(key(item), item)
  return [...seen.values()]
}
