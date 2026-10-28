import { useTranslation } from 'react-i18next'

const STAR = 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'

// Compact read-only rating for list cards: five short bars.
export function RatingBars({ rating }: { rating: number | null }) {
  const { t } = useTranslation()
  if (!rating) return null
  return (
    <span className="flex gap-[3px]" role="img" aria-label={t('diary.rating', { rating })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1 w-3.5 rounded-sm ${i <= rating ? 'bg-ink' : 'bg-line'}`} />
      ))}
    </span>
  )
}

export function StarInput({ value, onChange }: { value: number | null; onChange: (rating: number) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const on = value !== null && i <= value
        return (
          <button
            key={i}
            type="button"
            aria-label={t('show.star', { count: i })}
            aria-pressed={value === i}
            onClick={() => onChange(i)}
            className="flex size-12 items-center justify-center transition-transform active:scale-90"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d={STAR}
                fill={on ? 'var(--color-ink)' : 'none'}
                stroke={on ? 'var(--color-ink)' : '#9c978c'}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
