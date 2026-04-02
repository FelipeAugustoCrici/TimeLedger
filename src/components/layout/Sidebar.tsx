import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, BarChart2, Settings,
  Zap, X, Calculator, CalendarRange, ChevronLeft, ChevronRight, LogOut,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/common/helpers';
import { useAuth } from '@/lib/auth/useAuth';

const NAV_MAIN = [
  { to: '/',          label: 'Dashboard',      icon: LayoutDashboard, end: true,  disabled: false },
  { to: '/entries',   label: 'Lançamentos',    icon: ClipboardList,   end: false, disabled: false },
  { to: '/time-grid', label: 'Grade de Horas', icon: CalendarRange,   end: false, disabled: false },
  { to: '/simulator', label: 'Simulador PJ',   icon: Calculator,      end: false, disabled: false },
  { to: '/reports',   label: 'Relatórios',     icon: BarChart2,       end: false, disabled: true  },
];

const NAV_BOTTOM = [
  { to: '/settings', label: 'Configurações', icon: Settings, end: false, disabled: false },
];

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const renderNavItem = ({ to, label, icon: Icon, end, disabled }: typeof NAV_MAIN[0]) => {
    if (disabled) {
      return (
        <div
          key={to}
          title={collapsed ? label : undefined}
          className={cn(
            'flex items-center rounded-xl px-3 py-2 text-sm text-disabled cursor-not-allowed select-none',
            collapsed ? 'justify-center' : 'gap-3',
          )}
        >
          <Icon size={15} className="shrink-0 opacity-40" />
          {!collapsed && (
            <>
              <span className="flex-1 opacity-40">{label}</span>
              <span className="text-[9px] font-semibold bg-white/5 text-muted/60 px-1.5 py-0.5 rounded-full">
                Em breve
              </span>
            </>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={onClose}
        title={collapsed ? label : undefined}
        className={({ isActive }) => cn(
          'relative flex items-center rounded-xl px-3 py-2 text-sm transition-all duration-150',
          collapsed ? 'justify-center' : 'gap-3',
          isActive
            ? 'bg-brand/15 text-brand-light font-medium shadow-[0_0_12px_rgba(99,102,241,0.15)] border border-brand/20'
            : 'text-secondary hover:bg-white/5 hover:text-primary border border-transparent',
        )}
      >
        {({ isActive }) => (
          <>
            {/* Active left glow dot */}
            {isActive && !collapsed && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand-light shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
            )}
            <Icon
              size={15}
              className={cn(
                'shrink-0 transition-colors',
                isActive ? 'text-brand-light' : 'text-muted group-hover:text-primary',
              )}
            />
            {!collapsed && <span>{label}</span>}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        // Base layout
        'relative flex flex-col h-full',
        // Floating panel style — no hard border, rounded right side
        'rounded-2xl',
        // Glass-like dark gradient background
        'bg-gradient-to-b from-[#0e1628] via-[#0c1422] to-[#0a1020]',
        // Soft shadow instead of border
        'shadow-[4px_0_32px_rgba(0,0,0,0.5),inset_-1px_0_0_rgba(255,255,255,0.04)]',
        // Mobile: fixed overlay
        'lg:static',
        // Width
        collapsed ? 'w-[60px]' : 'w-[210px]',
        // Mobile positioning
        'fixed inset-y-0 left-0 z-40 lg:inset-y-auto lg:left-auto',
        'transition-all duration-300 ease-in-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        // Mobile: no rounding on left side
        'lg:rounded-2xl rounded-r-2xl rounded-l-none lg:rounded-l-2xl',
      )}>

        {/* Logo */}
        <div className={cn(
          'flex h-14 items-center shrink-0',
          collapsed ? 'justify-center px-0' : 'justify-between px-4',
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand shadow-[0_0_16px_rgba(99,102,241,0.5)] shrink-0">
                <Zap size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary leading-none tracking-tight">TaskManager</p>
                <p className="text-[10px] text-muted mt-0.5">Workspace</p>
              </div>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand shadow-[0_0_16px_rgba(99,102,241,0.5)]">
              <Zap size={14} className="text-white" strokeWidth={2.5} />
            </div>
          )}
          <button
            onClick={onClose}
            className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-primary transition-colors"
            aria-label="Fechar menu"
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted/60 select-none">
              Principal
            </p>
          )}
          {NAV_MAIN.map(renderNavItem)}

          {/* Productivity mini-widget — only when expanded */}
          {!collapsed && <ProductivityWidget />}
        </nav>

        {/* Settings */}
        <div className="px-2 pb-2 flex flex-col gap-0.5">
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted/60 select-none">
              Sistema
            </p>
          )}
          {NAV_BOTTOM.map(renderNavItem)}
        </div>

        {/* User footer — integrated, no hard border */}
        <div className={cn(
          'shrink-0 px-2 pb-3',
        )}>
          {/* Soft divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-3" />

          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/25 text-xs font-bold text-brand-light cursor-default ring-1 ring-brand/20"
                title={user?.name ?? 'Usuário'}
              >
                {initials}
              </div>
              <button
                onClick={logout}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/8 hover:text-danger transition-colors"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5 hover:bg-white/[0.07] transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/25 text-xs font-bold text-brand-light shrink-0 ring-1 ring-brand/25">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary truncate leading-none">{user?.name ?? 'Usuário'}</p>
                <p className="text-[10px] text-muted/70 truncate mt-0.5">{user?.email ?? ''}</p>
              </div>
              <button
                onClick={logout}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted/60 hover:bg-white/8 hover:text-danger transition-colors shrink-0"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle — floating pill style */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden lg:flex absolute -right-3 top-[4.5rem] h-6 w-6 items-center justify-center z-50',
            'rounded-full bg-[#1a2840] text-muted hover:text-primary',
            'shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]',
            'transition-all duration-200 hover:scale-110',
          )}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </aside>
    </>
  );
}

// ─── Productivity mini-widget ─────────────────────────────────────────────────

function ProductivityWidget() {
  const now = new Date();
  const hour = now.getHours();
  // Simple time-of-day productivity tip
  const tips = [
    { range: [6, 11],  label: 'Manhã produtiva',  sub: 'Foco em tarefas complexas',  color: 'text-warning',     icon: '☀️' },
    { range: [11, 14], label: 'Pico de energia',   sub: 'Ótimo para reuniões',        color: 'text-success',     icon: '⚡' },
    { range: [14, 17], label: 'Tarde focada',       sub: 'Ideal para execução',        color: 'text-brand-light', icon: '🎯' },
    { range: [17, 21], label: 'Revisão do dia',     sub: 'Feche pendências abertas',   color: 'text-info',        icon: '📋' },
    { range: [21, 24], label: 'Modo noturno',       sub: 'Planeje o amanhã',           color: 'text-muted',       icon: '🌙' },
    { range: [0, 6],   label: 'Madrugada',          sub: 'Lembre-se de descansar',     color: 'text-muted',       icon: '💤' },
  ];

  const tip = tips.find(({ range }) => hour >= range[0] && hour < range[1]) ?? tips[0];

  return (
    <div className="mt-3 mx-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <TrendingUp size={12} className="text-brand-light shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted/70">Produtividade</p>
      </div>
      <p className={cn('text-xs font-semibold leading-tight', tip.color)}>
        {tip.icon} {tip.label}
      </p>
      <p className="text-[10px] text-muted/60 mt-0.5 leading-snug">{tip.sub}</p>
    </div>
  );
}
