import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StateTileMap } from '../components/StateTileMap'
import { EmptyState, ErrorState, PageTitle, SectionLabel, Skeleton } from '../components/ui'
import { useStats } from '../data/queries'

export function StatsPage() {
  const { t } = useTranslation()
  const [year, setYear] = useState<number | null>(null)
  const stats = useStats(year)
  // Year chips come from the all-time stats, so they stay put while switching.
  const allTime = useStats(null)
  const years = allTime.data?.years ?? []

  return (
    <>
      <PageTitle>{t('stats.title')}</PageTitle>

      {years.length > 1 && (
        <div role="group" aria-label={t('stats.period')} className="flex flex-wrap gap-2">
          {[null, ...years.slice(0, 4)].map((y) => (
            <button
              key={y ?? 'all'}
              type="button"
              aria-pressed={year === y}
              onClick={() => setYear(y)}
              className={`min-h-9 rounded-full border px-3.5 text-[13px] ${year === y ? 'border-ink bg-ink font-semibold text-paper' : 'border-line bg-card font-medium'}`}
            >
              {y ?? t('stats.all')}
            </button>
          ))}
        </div>
      )}

      {stats.isPending && <Skeleton count={3} />}
      {stats.isError && <ErrorState onRetry={() => stats.refetch()} />}
      {stats.isSuccess && stats.data.shows === 0 && <EmptyState title={t('diary.emptyTitle')} body={t('stats.emptyBody')} />}
      {stats.isSuccess && stats.data.shows > 0 && (
        <>
          <dl className="grid grid-cols-3 gap-2">
            <Number label={t('stats.shows')} value={stats.data.shows} highlight />
            <Number label={t('stats.cities')} value={stats.data.cities} />
            <Number label={t('stats.venues')} value={stats.data.venues} />
          </dl>

          <section className="flex flex-col gap-3.5 rounded-[14px] bg-card p-4">
            <h2 className="display text-2xl" style={{ fontStretch: '70%' }}>
              {t('stats.states', { count: stats.data.states.length })}
            </h2>
            <StateTileMap visited={stats.data.states} />
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionLabel>{t('stats.topArtists')}</SectionLabel>
            <ol className="flex flex-col gap-3 rounded-[10px] bg-card px-4 py-3.5">
              {stats.data.top_artists.map((artist) => (
                <li key={artist.name} className="flex flex-col gap-[5px]">
                  <span className="flex justify-between text-sm">
                    <span className="font-semibold">{artist.name}</span>
                    <span className="font-mono font-bold">{artist.count}×</span>
                  </span>
                  <span className="block h-2 overflow-hidden rounded bg-line-soft">
                    <span
                      className="block h-2 rounded bg-ink"
                      style={{ width: `${(artist.count / stats.data.top_artists[0].count) * 100}%` }}
                    />
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </>
  )
}

function Number({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-[10px] p-3.5 ${highlight ? 'bg-ink text-paper' : 'bg-card'}`}>
      <dt className={`label text-[10px] ${highlight ? 'text-signal' : 'text-muted'}`}>{label}</dt>
      <dd className="display text-[44px] leading-none" style={{ fontStretch: '68%', fontWeight: 900 }}>
        {value}
      </dd>
    </div>
  )
}
