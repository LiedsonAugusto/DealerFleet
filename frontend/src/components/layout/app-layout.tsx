import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/vehicles', label: 'Veículos' },
  { to: '/dealers', label: 'Concessionárias' },
]

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
          <NavLink to="/vehicles" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">
              DF
            </span>
            <span className="text-base font-semibold text-slate-900">DealerFleet</span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
