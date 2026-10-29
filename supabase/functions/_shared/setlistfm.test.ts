import { describe, expect, it } from 'vitest'
import {
  germanCityName,
  germanStateCode,
  parseArtists,
  parseEventDate,
  parseSetlist,
  uniqueBy,
  type SetlistFmSetlist,
} from './setlistfm.ts'

const raw: SetlistFmSetlist = {
  id: '63a1b2c3',
  eventDate: '18-10-2026',
  url: 'https://www.setlist.fm/setlist/kraftklub/2026/x.html',
  artist: { mbid: 'mbid-kraftklub', name: 'Kraftklub' },
  venue: {
    id: 'venue-columbiahalle',
    name: 'Columbiahalle',
    city: { id: '2950159', name: 'Berlin', stateCode: '16', coords: { lat: 52.52, long: 13.41 }, country: { code: 'DE' } },
  },
  tour: { name: 'Tour 2026 ' },
  sets: { set: [{ song: [{ name: 'Unsere Fans' }, { name: '' }] }, { song: [{ name: 'Randale' }] }] },
}

describe('parseSetlist', () => {
  it('maps a setlist.fm setlist to an event anchored on external ids', () => {
    expect(parseSetlist(raw)).toEqual({
      setlistfmId: '63a1b2c3',
      date: '2026-10-18',
      url: 'https://www.setlist.fm/setlist/kraftklub/2026/x.html',
      tourName: 'Tour 2026',
      songs: ['Unsere Fans', 'Randale'],
      artist: { mbid: 'mbid-kraftklub', name: 'Kraftklub' },
      venue: { setlistfmId: 'venue-columbiahalle', name: 'Columbiahalle' },
      city: { geonamesId: '2950159', name: 'Berlin', countryCode: 'DE', stateCode: 'BE', lat: 52.52, lng: 13.41 },
    })
  })

  it('skips setlists without the ids we rely on', () => {
    expect(parseSetlist({ ...raw, artist: { mbid: '', name: 'X' } })).toBeNull()
    expect(parseSetlist({ ...raw, eventDate: '2026-10-18' })).toBeNull()
  })
})

describe('germanStateCode', () => {
  it('handles bare and prefixed admin1 codes', () => {
    expect(germanStateCode('DE', '02')).toBe('BY')
    expect(germanStateCode('de', 'DE.07')).toBe('NW')
    expect(germanStateCode('DE', '2')).toBe('BY')
  })

  it('returns null outside Germany or for unknown codes', () => {
    expect(germanStateCode('AT', '02')).toBeNull()
    expect(germanStateCode('DE', '99')).toBeNull()
    expect(germanStateCode('DE')).toBeNull()
  })
})

describe('germanCityName', () => {
  it('replaces English exonyms and keeps everything else', () => {
    expect(germanCityName('Munich')).toBe('München')
    expect(germanCityName('Cologne ')).toBe('Köln')
    expect(germanCityName('Leipzig')).toBe('Leipzig')
  })
})

describe('parseEventDate', () => {
  it('converts dd-MM-yyyy to ISO', () => {
    expect(parseEventDate('03-08-2025')).toBe('2025-08-03')
    expect(parseEventDate('2025-08-03')).toBeNull()
  })
})

describe('uniqueBy', () => {
  it('keeps one item per key so upserts never touch a row twice', () => {
    expect(uniqueBy([{ k: 'a', v: 1 }, { k: 'a', v: 2 }, { k: 'b', v: 3 }], (x) => x.k)).toEqual([
      { k: 'a', v: 2 },
      { k: 'b', v: 3 },
    ])
  })
})

describe('parseArtists', () => {
  it('puts exact matches first and keeps the rest in relevance order', () => {
    const body = {
      total: 4,
      artist: [
        { mbid: 'toten', name: 'Die Toten Ärzte', disambiguation: 'Die Ärzte & Die Toten Hosen Tribute Band' },
        { mbid: 'aerzte', name: 'Die Ärzte', disambiguation: '' },
        { mbid: 'feat', name: 'Die Ärzte feat. Axel Knabben' },
        { name: 'No id' },
      ],
    }
    expect(parseArtists(body, 'die arzte')).toEqual([
      { mbid: 'aerzte', name: 'Die Ärzte', disambiguation: null },
      { mbid: 'toten', name: 'Die Toten Ärzte', disambiguation: 'Die Ärzte & Die Toten Hosen Tribute Band' },
      { mbid: 'feat', name: 'Die Ärzte feat. Axel Knabben', disambiguation: null },
    ])
  })

  it('handles an empty answer', () => {
    expect(parseArtists({ total: 0 }, 'x')).toEqual([])
  })
})
