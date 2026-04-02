import { ChevronLeft, ChevronRight, Menu, Sun, Moon, Plus } from 'lucide-react';
import { useTheme } from '@/lib/theme/useTheme';
import { useAuth } from '@/lib/auth/useAuth';
import { TimerWidget } from '@/components/shared/TimerWidget';
import { cn } from '@/common/helpers';
import moment from 'moment/min/moment-with-locales';

interface HeaderProps {
  onMenuToggle: () => void;
  monthOffset?: number;
  onMonthChange?: (offset: number) => void;
  showMonthNav?: boolean;
  onNewEntry?: () => void;
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

export function Header({ onMenuToggle, monthOffset = 0, onMonthChange, showMonthNav = false, onNewEntry }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <header className={cn(
      'flex h-14 shrink-0 items-center justify-between gap-4',
      'rounded-2xl px-4 lg:px-5',
      // Glass effect
      'bg-sidebar/70 backdrop-blur-xl',
      // Soft border instead of hard line
      'border border-white/[0.06]',
      // Depth shadow
      'shadow-[0_4px_24px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.04)_inset]',
    )}>

      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuToggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 hidden sm:block">
          <p className="text-sm font-semibold text-primary leading-none truncate">
            {greeting(user?.name ?? '')}
          </p>
          <p className="text-xs text-muted mt-0.5 capitalize">{dateLabel()}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">

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

        {/* Timer Widget */}
        <TimerWidget />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* New entry button */}
        {onNewEntry && (
          <button
            onClick={onNewEntry}
            className={cn(
              'hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold',
              'bg-brand text-white hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20',
            )}
          >
            <Plus size={14} />
            Novo lançamento
          </button>
        )}

        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-light shrink-0 cursor-default select-none"
          title={user?.name ?? 'Usuário'}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
