import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, BarChart2, Settings, Zap, X, Calculator, CalendarRange } from 'lucide-react';
import { cn } from '@/common/helpers';
import { useAuth } from '@/lib/auth/useAuth';

const NAV = [
  { to: '/',          label: 'Dashboard',    icon: LayoutDashboard, end: true,  disabled: false },
  { to: '/entries',   label: 'Lançamentos',  icon: ClipboardList,   end: false, disabled: false },
  { to: '/time-grid', label: 'Grade de Horas', icon: CalendarRange,  end: false, disabled: false },
  { to: '/simulator', label: 'Simulador PJ', icon: Calculator,      end: false, disabled: false },
  { to: '/reports',   label: 'Relatórios',   icon: BarChart2,       end: false, disabled: true  },
  { to: '/settings',  label: 'Configurações',icon: Settings,        end: false, disabled: false },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar border-r border-border',
        'transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand shadow-lg shadow-brand/30">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary leading-none">TaskManager</p>
              <p className="text-[10px] text-muted mt-0.5">Workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-primary transition-colors" aria-label="Fechar menu">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted select-none">Principal</p>
          {NAV.map(({ to, label, icon: Icon, end, disabled }) =>
            disabled ? (
              <div key={to} className="nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-disabled cursor-not-allowed select-none">
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{label}</span>
                <span className="text-[9px] font-medium bg-elevated text-muted px-1.5 py-0.5 rounded-full">Em breve</span>
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) => cn(
                  'nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                  isActive ? 'nav-active font-medium' : 'text-secondary hover:bg-hover hover:text-primary',
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={cn('shrink-0 transition-colors', isActive ? 'text-brand-light' : '')} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-light shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary truncate">{user?.name ?? 'Usuário'}</p>
              <p className="text-[10px] text-muted truncate">{user?.email ?? ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
