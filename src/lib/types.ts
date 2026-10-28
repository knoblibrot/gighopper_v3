export type StateCode =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH'

export type Event = {
  id: string
  date: string // yyyy-MM-dd
  tour_name: string | null
  songs: string[]
  setlistfm_url: string | null
  artist: { id: string; name: string }
  venue: { id: string; name: string; city: { name: string; state_code: StateCode | null } }
}

export type Attendance = {
  id: string
  rating: number | null
  notes: string
  event: Event
}

// One result of the setlist-search edge function.
export type FoundEvent = {
  id: string
  date: string
  artistName: string
  venueName: string
  cityName: string
  stateCode: StateCode | null
}

export type SearchPage = {
  total: number
  page: number
  perPage: number
  events: FoundEvent[]
}

export type Stats = {
  shows: number
  cities: number
  venues: number
  states: StateCode[]
  top_artists: Array<{ name: string; count: number }>
  years: number[]
}

export type ShowFacts = {
  show_number: number
  artist_count: number
  city_count: number
}
