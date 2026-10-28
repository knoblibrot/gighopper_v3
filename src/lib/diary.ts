import type { Attendance } from './types'
import { isPast } from './dates'

export type DiaryYear = { year: string; shows: Attendance[] }

// Past shows grouped by year, newest first.
export function groupByYear(attendances: Attendance[], now = new Date()): DiaryYear[] {
  const past = attendances
    .filter((a) => isPast(a.event.date, now))
    .sort((a, b) => b.event.date.localeCompare(a.event.date))

  const years: DiaryYear[] = []
  for (const show of past) {
    const year = show.event.date.slice(0, 4)
    const last = years.at(-1)
    if (last?.year === year) last.shows.push(show)
    else years.push({ year, shows: [show] })
  }
  return years
}

// Upcoming shows, soonest first.
export function upcoming(attendances: Attendance[], now = new Date()): Attendance[] {
  return attendances
    .filter((a) => !isPast(a.event.date, now))
    .sort((a, b) => a.event.date.localeCompare(b.event.date))
}
