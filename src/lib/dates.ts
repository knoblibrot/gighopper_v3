// Dates are stored as plain yyyy-MM-dd strings. Parse them as local calendar
// days so a show never shifts by a day because of time zones.

export function parseDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function isPast(iso: string, now = new Date()): boolean {
  return iso <= todayIso(now)
}

export function daysUntil(iso: string, now = new Date()): number {
  const today = parseDay(todayIso(now))
  return Math.round((parseDay(iso).getTime() - today.getTime()) / 86_400_000)
}

// Parts for a ticket stub: "OKT", "18", "2026".
export function stubParts(iso: string, locale: string) {
  const date = parseDay(iso)
  const month = new Intl.DateTimeFormat(locale, { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase()
  return { month, day: String(date.getDate()).padStart(2, '0'), year: String(date.getFullYear()) }
}

export function longDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .format(parseDay(iso))
    .toUpperCase()
}

export function numericDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parseDay(iso))
}
