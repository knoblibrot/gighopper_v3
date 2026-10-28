import { describe, expect, it } from 'vitest'
import { daysUntil, isPast, stubParts } from './dates'
import { groupByYear, upcoming } from './diary'
import type { Attendance } from './types'

const show = (id: string, date: string): Attendance => ({
  id,
  rating: null,
  notes: '',
  event: {
    id: `e-${id}`,
    date,
    tour_name: null,
    songs: [],
    setlistfm_url: null,
    artist: { id: 'a', name: 'Kraftklub' },
    venue: { id: 'v', name: 'Columbiahalle', city: { name: 'Berlin', state_code: 'BE' } },
  },
})

const now = new Date(2026, 9, 28, 12) // 28 Oct 2026

describe('groupByYear', () => {
  it('groups past shows by year, newest first, and leaves out future ones', () => {
    const years = groupByYear(
      [show('a', '2025-12-06'), show('b', '2026-10-18'), show('c', '2026-11-21'), show('d', '2026-03-14')],
      now,
    )
    expect(years.map((y) => [y.year, y.shows.map((s) => s.id)])).toEqual([
      ['2026', ['b', 'd']],
      ['2025', ['a']],
    ])
  })
})

describe('upcoming', () => {
  it('returns future shows soonest first', () => {
    expect(upcoming([show('a', '2027-03-12'), show('b', '2026-11-21'), show('c', '2026-01-01')], now).map((s) => s.id)).toEqual(['b', 'a'])
  })
})

describe('dates', () => {
  it('treats today as past and counts calendar days', () => {
    expect(isPast('2026-10-28', now)).toBe(true)
    expect(isPast('2026-10-29', now)).toBe(false)
    expect(daysUntil('2026-11-21', now)).toBe(24)
  })

  it('formats stub parts in German', () => {
    expect(stubParts('2026-10-18', 'de-DE')).toEqual({ month: 'OKT', day: '18', year: '2026' })
  })
})
