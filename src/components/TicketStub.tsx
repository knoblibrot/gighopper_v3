import { Link } from 'react-router'
import { locale } from '../i18n'
import { stubParts } from '../lib/dates'
import type { Attendance } from '../lib/types'
import { RatingBars } from './Rating'

// The core visual: every logged show is a ticket stub.
export function TicketStub({ attendance }: { attendance: Attendance }) {
  const { event } = attendance
  const { month, day, year } = stubParts(event.date, locale())

  return (
    <Link
      to={`/show/${attendance.id}`}
      className="relative flex min-h-24 rounded-[10px] bg-card text-ink no-underline transition-transform active:scale-[0.99]"
    >
      <span className="flex w-[76px] flex-none flex-col items-center justify-center gap-0.5 border-r-2 border-dashed border-line font-mono">
        <span className="text-[11px] font-bold tracking-[0.08em] text-muted">{month}</span>
        <span className="text-[28px] leading-none font-bold">{day}</span>
        <span className="text-[11px] text-muted">{year}</span>
      </span>
      <span aria-hidden="true" className="absolute -top-1.5 left-[71px] size-3 rounded-full bg-paper" />
      <span aria-hidden="true" className="absolute -bottom-1.5 left-[71px] size-3 rounded-full bg-paper" />
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-[5px] px-4 py-3.5">
        <span className="display text-[25px] break-words">{event.artist.name}</span>
        <span className="text-[13px] text-muted">
          {event.venue.name} · {event.venue.city.name}
        </span>
        <RatingBars rating={attendance.rating} />
      </span>
    </Link>
  )
}
