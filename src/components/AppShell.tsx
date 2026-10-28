import { NavLink, Link, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Icon, type IconName } from './Icon'

const TABS: Array<{ to: string; key: string; icon: IconName }> = [
  { to: '/', key: 'nav.diary', icon: 'ticket' },
  { to: '/fuer-dich', key: 'nav.forYou', icon: 'bell' },
  { to: '/statistik', key: 'nav.stats', icon: 'chart' },
]

export function AppShell() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <main className="flex flex-col gap-5 px-5 pt-7 pb-[calc(84px+96px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <Link
        to="/neu"
        aria-label={t('nav.add')}
        className="fixed right-[max(20px,calc(50%-208px))] bottom-[calc(102px+env(safe-area-inset-bottom))] flex size-[60px] items-center justify-center rounded-full bg-signal text-ink shadow-[0_6px_18px_rgba(22,21,15,0.28)] transition-transform active:scale-95"
      >
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </Link>

      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex h-[84px] max-w-md items-start justify-around pt-2">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                `flex min-h-11 min-w-20 flex-col items-center gap-1 text-[11px] ${isActive ? 'font-bold text-ink' : 'font-medium text-muted'}`
              }
            >
              <Icon name={tab.icon} size={24} />
              {t(tab.key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
