import { ChevronLeft, ChevronRight, Menu, Settings, Sun, Moon, LogOut, Zap } from 'lucide-react';
import { useTheme } from '@/lib/theme/useTheme';
import { useAuth } from '@/lib/auth/useAuth';
import moment from 'moment/min/moment-with-locales';

interface HeaderProps {
  onMenuToggle: () => void;
  monthOffset?: number;
  onMonthChange?: (offset: number) => void;
  showMonthNav?: boolean;
}

function greeting(name: string): string {
  const h = new Date().getHours();
  const emoji = h < 12 ? '☀️' : h < 18 ? '👋' : '🌙';
  const word  = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const first = name.split(' ')[0];
  return `${word}, ${first} ${emoji}`;
}

function dateLabel(): string {
  return moment().locale('pt-br').format('dddd, D [de] MMMM');
}

function monthLabel(offset: number): string {
  return moment().add(offset, 'months').locale('pt-br').format('MMMM YYYY');
}

export function Header({ onMenuToggle, monthOffset = 0, onMonthChange, showMonthNav = false }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-topbar px-5 lg:px-6 gap-4">

      {/* Left — greeting + date */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>

        {/* Avatar */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-light select-none">
          {initials}
        </div>

        {/* Text */}
        <div className="min-w-0 hidden sm:block">
          <p className="text-sm font-semibold text-primary leading-none truncate">
            {greeting(user?.name ?? '')}
          </p>
          <p className="text-xs text-muted mt-0.5 capitalize">{dateLabel()}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Team pill */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-1.5">
          <Zap size={13} className="text-brand-light" />
          <span className="text-xs font-medium text-secondary">
            {user?.name?.split(' ').slice(0, 2).join(' ') ?? 'Meu espaço'}
          </span>
          <button
            onClick={toggleTheme}
            className="ml-1 text-muted hover:text-primary transition-colors"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>

        {/* Month navigation */}
        {showMonthNav && onMonthChange && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-elevated px-2 py-1.5">
            <button
              onClick={() => onMonthChange(monthOffset - 1)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-primary capitalize px-1 min-w-[90px] text-center">
              {monthLabel(monthOffset)}
            </span>
            <button
              onClick={() => onMonthChange(monthOffset + 1)}
              disabled={monthOffset >= 0}
              className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Próximo mês"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-danger transition-colors"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
