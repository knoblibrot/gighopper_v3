import { useTranslation } from 'react-i18next'
import { PageTitle } from '../components/ui'

export function SetupPage() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-5 pt-16">
      <PageTitle>{t('setup.title')}</PageTitle>
      <p className="text-[15px] leading-relaxed">{t('setup.body')}</p>
    </main>
  )
}
