import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ErrorState, PrimaryButton } from '../components/ui'
import { db } from '../lib/supabase'

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    const { error } = await db().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5">
      <div className="flex flex-col gap-3">
        <span className="label text-muted">Gighopper</span>
        <h1 className="display text-[56px]">{t('auth.title')}</h1>
        <p className="text-[15px] leading-relaxed text-muted">{t('auth.intro')}</p>
      </div>

      {status === 'sent' ? (
        <p role="status" className="rounded-[10px] bg-ink p-4 text-[15px] leading-relaxed text-paper">
          {t('auth.sent', { email })}
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label htmlFor="email" className="label text-muted">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[52px] rounded-[10px] border-2 border-ink bg-card px-4 text-[17px] outline-none"
          />
          <PrimaryButton type="submit" disabled={status === 'sending'}>
            {t('auth.submit')}
          </PrimaryButton>
          {status === 'error' && <ErrorState />}
        </form>
      )}
    </main>
  )
}
