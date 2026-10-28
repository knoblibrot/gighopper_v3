import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from '../components/Icon'
import { ErrorState, IconLink, PrimaryButton, Skeleton } from '../components/ui'
import { RateLimitedError, useDiary, useLogShows, useShowSearch } from '../data/queries'
import { locale } from '../i18n'
import { isPast, numericDate } from '../lib/dates'
import type { FoundEvent } from '../lib/types'

type Tab = 'past' | 'upcoming'

export function AddShowPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [artist, setArtist] = useState('')
  const [tab, setTab] = useState<Tab>('past')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const search = useShowSearch(artist)
  const diary = useDiary()
  const logShows = useLogShows()

  const inDiary = new Set(diary.data?.map((a) => a.event.id))
  const all = search.data?.pages.flatMap((p) => p.events) ?? []
  const shown = all
    .filter((e) => (tab === 'past' ? isPast(e.date) : !isPast(e.date)))
    .sort((a, b) => (tab === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))

  function submit(event: FormEvent) {
    event.preventDefault()
    setSelected(new Set())
    setArtist(input.trim())
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    await logShows.mutateAsync([...selected])
    navigate('/')
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <main className="flex flex-col gap-4 px-5 pt-5 pb-40">
        <header className="flex items-center justify-between">
          <h1 className="display text-[34px]">{t('add.title')}</h1>
          <IconLink to="/" label={t('common.close')} icon="close" />
        </header>

        <form onSubmit={submit} className="flex min-h-[52px] items-center gap-2.5 rounded-[10px] border-2 border-ink bg-card pr-1.5 pl-3.5">
          <Icon name="search" size={20} />
          <label htmlFor="artist" className="sr-only">
            {t('add.searchLabel')}
          </label>
          <input
            id="artist"
            type="search"
            enterKeyHint="search"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('add.searchPlaceholder')}
            className="min-w-0 flex-1 bg-transparent text-[17px] font-semibold outline-none"
          />
          <button type="submit" className="min-h-10 rounded-lg bg-ink px-3 text-sm font-semibold text-paper">
            {t('add.search')}
          </button>
        </form>

        <div role="group" className="grid grid-cols-2 gap-1 rounded-[10px] bg-well p-1">
          {(['past', 'upcoming'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
              className={`min-h-[38px] rounded-[7px] text-sm ${tab === value ? 'bg-card font-semibold text-ink' : 'font-medium text-muted'}`}
            >
              {t(`add.${value}`)}
            </button>
          ))}
        </div>

        {!artist && <p className="text-sm leading-relaxed text-muted">{t('add.hint')}</p>}
        {search.isPending && artist && <Skeleton count={4} />}
        {search.isError &&
          (search.error instanceof RateLimitedError ? (
            <p role="alert" className="text-sm">{t('add.rateLimited')}</p>
          ) : (
            <ErrorState onRetry={() => search.refetch()} />
          ))}

        {search.isSuccess && (
          <>
            <p className="text-sm leading-relaxed text-muted">
              {all.length === 0
                ? t('add.none')
                : shown.length === 0
                  ? t('add.noneInTab')
                  : tab === 'past'
                    ? t('add.found', { count: shown.length })
                    : t('add.foundUpcoming')}
            </p>
            {shown.length > 0 && (
              <ul className="flex flex-col rounded-[10px] bg-card">
                {shown.map((event) => (
                  <ResultRow
                    key={event.id}
                    event={event}
                    done={inDiary.has(event.id)}
                    on={selected.has(event.id)}
                    onToggle={() => toggle(event.id)}
                  />
                ))}
              </ul>
            )}
            {search.hasNextPage && (
              <button
                type="button"
                onClick={() => search.fetchNextPage()}
                disabled={search.isFetchingNextPage}
                className="min-h-11 self-center text-sm font-semibold underline underline-offset-4"
              >
                {search.isFetchingNextPage ? t('common.loading') : t('add.more')}
              </button>
            )}
          </>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper px-5 pt-4 pb-[calc(28px+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md">
          <PrimaryButton type="button" disabled={selected.size === 0 || logShows.isPending} onClick={save}>
            {selected.size === 0 ? t('add.select') : t('add.save', { count: selected.size })}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

function ResultRow({ event, done, on, onToggle }: { event: FoundEvent; done: boolean; on: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  const body = (
    <>
      <span className="w-[92px] flex-none font-mono text-[13px] font-bold">{numericDate(event.date, locale())}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="text-[15px] font-semibold">{event.venueName}</span>
        <span className="text-[13px] text-muted">{event.cityName}</span>
      </span>
    </>
  )

  if (done) {
    return (
      <li className="flex min-h-16 items-center gap-3.5 border-b border-line-soft px-4 py-2.5 last:border-0">
        {body}
        <span className="label rounded border border-line px-1.5 py-1 text-[10px] text-muted">{t('add.inDiary')}</span>
      </li>
    )
  }

  return (
    <li className="border-b border-line-soft last:border-0">
      <button type="button" aria-pressed={on} onClick={onToggle} className="flex min-h-16 w-full items-center gap-3.5 px-4 py-2.5 text-left">
        {body}
        {on ? (
          <span className="flex size-7 items-center justify-center rounded-md bg-signal text-ink">
            <Icon name="check" size={18} strokeWidth={2.6} />
          </span>
        ) : (
          <span className="size-7 rounded-md border-2 border-[#b9b4a9]" />
        )}
      </button>
    </li>
  )
}
