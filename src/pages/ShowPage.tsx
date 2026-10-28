import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '../components/Icon'
import { StarInput } from '../components/Rating'
import { ErrorState, SectionLabel, Skeleton } from '../components/ui'
import { useAttendance, useRemoveAttendance, useShowFacts, useUpdateAttendance } from '../data/queries'
import { locale } from '../i18n'
import { isPast, longDate } from '../lib/dates'

export function ShowPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const attendance = useAttendance(id)

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <main className="flex flex-col gap-[22px] px-5 pt-4 pb-12">
        <header>
          <Link to="/" className="flex min-h-11 items-center gap-1 text-[15px] font-semibold">
            <Icon name="back" />
            {t('nav.diary')}
          </Link>
        </header>
        {attendance.isPending && <Skeleton count={2} />}
        {attendance.isError && <ErrorState onRetry={() => attendance.refetch()} />}
        {attendance.isSuccess && <ShowDetail key={attendance.data.id} id={id} />}
      </main>
    </div>
  )
}

function ShowDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: attendance } = useAttendance(id)
  const event = attendance!.event
  const past = isPast(event.date)
  const facts = useShowFacts(past ? event.id : undefined)
  const update = useUpdateAttendance(id)
  const remove = useRemoveAttendance()
  const [notes, setNotes] = useState(attendance!.notes)
  const [confirmRemove, setConfirmRemove] = useState(false)

  return (
    <>
      <article className="relative overflow-hidden rounded-[14px] bg-card">
        <div className="flex flex-col gap-2.5 bg-ink px-[22px] pt-[22px] pb-[26px] text-paper">
          <span className="label text-signal">{past ? longDate(event.date, locale()) : `${t('show.upcoming')} · ${longDate(event.date, locale())}`}</span>
          <h1 className="display text-[64px] leading-[0.88] break-words hyphens-auto" style={{ fontStretch: '62%', fontWeight: 900 }}>
            {event.artist.name}
          </h1>
          <span className="flex items-center gap-1.5 text-[15px] text-line">
            <Icon name="pin" size={16} />
            {event.venue.name}, {event.venue.city.name}
          </span>
        </div>
        {facts.data && (
          <>
            <div aria-hidden="true" className="mx-3.5 border-t-2 border-dashed border-line" />
            <span aria-hidden="true" className="absolute bottom-[73px] -left-[9px] size-[18px] rounded-full bg-paper" />
            <span aria-hidden="true" className="absolute -right-[9px] bottom-[73px] size-[18px] rounded-full bg-paper" />
            <dl className="grid h-[82px] grid-cols-3 gap-2 px-[22px] pt-[18px] pb-5">
              <Fact label={t('show.yourShow')} value={`#${facts.data.show_number}`} />
              <Fact label={t('show.timesArtist', { artist: event.artist.name })} value={t('show.nth', { count: facts.data.artist_count })} />
              <Fact label={t('show.inCity', { city: event.venue.city.name })} value={t('show.nth', { count: facts.data.city_count })} />
            </dl>
          </>
        )}
      </article>

      {past && (
        <section className="flex flex-col gap-2.5">
          <SectionLabel>{t('show.rating')}</SectionLabel>
          <StarInput value={attendance!.rating} onChange={(rating) => update.mutate({ rating })} />
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <label htmlFor="notes" className="label text-muted">
          {t('show.notes')}
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          placeholder={t('show.notesPlaceholder')}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== attendance!.notes && update.mutate({ notes })}
          className="resize-none rounded-[10px] bg-card px-4 py-3.5 text-[15px] leading-normal outline-none focus:ring-2 focus:ring-ink"
        />
      </section>

      {past && (
        <section className="flex flex-col gap-2.5">
          <SectionLabel>{t('show.setlist')}</SectionLabel>
          {event.songs.length === 0 ? (
            <p className="text-sm text-muted">{t('show.setlistEmpty')}</p>
          ) : (
            <ol className="rounded-[10px] bg-card px-4 py-1.5">
              {event.songs.map((song, i) => (
                <li key={i} className="flex items-baseline gap-3.5 border-b border-line-soft py-2.5 text-[15px] last:border-0">
                  <span className="w-5 font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                  {song}
                </li>
              ))}
            </ol>
          )}
          {event.setlistfm_url && (
            <a href={event.setlistfm_url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-1.5 text-sm font-semibold">
              {t('show.openSetlist')}
              <Icon name="external" size={16} />
            </a>
          )}
        </section>
      )}

      <button
        type="button"
        disabled={remove.isPending}
        onClick={async () => {
          if (!confirmRemove) return setConfirmRemove(true)
          await remove.mutateAsync(id)
          navigate('/')
        }}
        className={`min-h-11 self-start rounded-lg px-3 text-sm font-semibold ${confirmRemove ? 'bg-signal text-ink' : 'text-muted underline underline-offset-4'}`}
      >
        {confirmRemove ? t('show.removeConfirm') : t('show.remove')}
      </button>
    </>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="label truncate text-[10px] text-muted">{label}</dt>
      <dd className="display text-[26px]" style={{ fontStretch: '70%' }}>
        {value}
      </dd>
    </div>
  )
}
