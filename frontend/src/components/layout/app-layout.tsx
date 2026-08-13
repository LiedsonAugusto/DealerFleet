import { NavLink, Outlet } from 'react-router'
import type { IconName } from '@/components/ui/icon'
import { Icon } from '@/components/ui/icon'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

const LINKS: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/vehicles', label: 'Veículos', icon: 'truck' },
  { to: '/dealers', label: 'Concessionárias', icon: 'building' },
]

const EXTERNAL: Array<{ href: string; label: string; title: string; icon: IconName }> = [
  {
    href: import.meta.env.VITE_SWAGGER_URL ?? 'http://localhost:8080/swagger-ui.html',
    label: 'API',
    title: 'Documentação Swagger da API',
    icon: 'bookOpen',
  },
  {
    href: import.meta.env.VITE_COVERAGE_URL ?? '/coverage/',
    label: 'Cobertura',
    title: 'Relatório de cobertura de testes (JaCoCo)',
    icon: 'chartBar',
  },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <NavLink
            to="/vehicles"
            className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          >
            <Logo className="size-7 text-brand-600" title="DealerFleet" />
            <span className="hidden text-base font-semibold tracking-tight text-slate-900 sm:block">
              DealerFleet
            </span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <Icon name={link.icon} />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 border-l border-slate-200 pl-3">
            {EXTERNAL.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                title={link.title}
                className="group flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:px-3"
              >
                <Icon name={link.icon} />
                <span className="hidden lg:inline">{link.label}</span>
                <Icon
                  name="externalLink"
                  className="size-3 opacity-0 transition-opacity group-hover:opacity-60"
                />
              </a>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
