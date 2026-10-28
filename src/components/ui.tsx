import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Icon } from './Icon'

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="display text-[46px]">{children}</h1>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </header>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="label text-muted">{children}</h2>
}

export function IconLink({ to, label, icon }: { to: string; label: string; icon: 'close' | 'back' }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-line bg-card text-ink"
    >
      <Icon name={icon} size={20} />
    </Link>
  )
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="display flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-[10px] bg-ink px-4 text-[19px] text-paper disabled:opacity-40"
      style={{ fontStretch: '80%' }}
    >
      {children}
    </button>
  )
}

export function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-[10px] bg-card" />
      ))}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[10px] bg-card p-4 text-sm">
      <p>{t('common.error')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="min-h-10 rounded-lg border border-ink px-3 font-semibold">
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[14px] border-2 border-dashed border-line p-5">
      <h2 className="display text-[28px]">{title}</h2>
      <p className="text-[15px] leading-relaxed text-muted">{body}</p>
      {action}
    </div>
  )
}
