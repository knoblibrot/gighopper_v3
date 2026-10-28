import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ErrorState, PageTitle, SectionLabel, Skeleton } from '../components/ui'
import { useDiary } from '../data/queries'
import { locale } from '../i18n'
import { daysUntil, numericDate } from '../lib/dates'
import { upcoming } from '../lib/diary'

export function ForYouPage() {
  const { t } = useTranslation()
  const diary = useDiary()
  const next = diary.data ? upcoming(diary.data) : []

  return (
    <>
      <PageTitle>{t('forYou.title')}</PageTitle>

      <section className="flex flex-col gap-2.5">
        <SectionLabel>{t('forYou.next')}</SectionLabel>
        {diary.isPending && <Skeleton count={1} />}
        {diary.isError && <ErrorState onRetry={() => diary.refetch()} />}
        {diary.isSuccess && next.length === 0 && <p className="text-sm leading-relaxed text-muted">{t('forYou.noneUpcoming')}</p>}
        {next.map((a) => (
          <Link key={a.id} to={`/show/${a.id}`} className="flex items-center gap-3.5 rounded-[10px] bg-card px-4 py-3.5">
            <span className="label rounded-md bg-ink px-2 py-1.5 text-[11px] whitespace-nowrap text-paper">
              {daysUntil(a.event.date) === 0 ? t('diary.today') : t('diary.inDays', { count: daysUntil(a.event.date) })}
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{a.event.artist.name}</span>
              <span className="text-[13px] text-muted">
                {numericDate(a.event.date, locale())} · {a.event.venue.name}
              </span>
            </span>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-2 rounded-[14px] bg-ink p-5 text-paper">
        <span className="label text-signal">{t('forYou.alertsTitle')}</span>
        <p className="text-[15px] leading-relaxed">{t('forYou.alertsBody')}</p>
      </section>
    </>
  )
}
