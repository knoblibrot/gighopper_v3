import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '../components/Icon'
import { TicketStub } from '../components/TicketStub'
import { EmptyState, ErrorState, PageTitle, Skeleton } from '../components/ui'
import { useDiary } from '../data/queries'
import { daysUntil } from '../lib/dates'
import { groupByYear, upcoming } from '../lib/diary'

export function DiaryPage() {
  const { t } = useTranslation()
  const diary = useDiary()

  if (diary.isPending) return <><PageTitle>{t('diary.title')}</PageTitle><Skeleton /></>
  if (diary.isError) return <><PageTitle>{t('diary.title')}</PageTitle><ErrorState onRetry={() => diary.refetch()} /></>

  const years = groupByYear(diary.data)
  const next = upcoming(diary.data)[0]
  const total = years.reduce((sum, y) => sum + y.shows.length, 0)
  const firstYear = years.at(-1)?.year

  return (
    <>
      <PageTitle sub={firstYear ? t('diary.since', { count: total, year: firstYear }) : undefined}>
        {t('diary.title')}
      </PageTitle>

      {next && (
        <Link to={`/show/${next.id}`} className="flex items-center gap-3.5 rounded-[10px] bg-ink px-4 py-3.5 text-paper">
          <span className="label rounded-md bg-signal px-2 py-[7px] text-[11px] whitespace-nowrap text-ink">
            {daysUntil(next.event.date) === 0 ? t('diary.today') : t('diary.inDays', { count: daysUntil(next.event.date) })}
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{next.event.artist.name}</span>
            <span className="text-[13px] text-ink-soft">
              {next.event.venue.name} · {next.event.venue.city.name}
            </span>
          </span>
          <Icon name="chevron" size={18} />
        </Link>
      )}

      {years.length === 0 ? (
        <EmptyState
          title={t('diary.emptyTitle')}
          body={t('diary.emptyBody')}
          action={
            <Link to="/neu" className="display rounded-[10px] bg-signal px-4 py-3 text-lg text-ink">
              {t('diary.emptyCta')}
            </Link>
          }
        />
      ) : (
        years.map((y) => (
          <section key={y.year} className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-1.5">
              <h2 className="display text-[30px]">{y.year}</h2>
              <span className="label text-muted">{t('common.showCount', { count: y.shows.length })}</span>
            </div>
            {y.shows.map((show) => (
              <TicketStub key={show.id} attendance={show} />
            ))}
          </section>
        ))
      )}
    </>
  )
}
