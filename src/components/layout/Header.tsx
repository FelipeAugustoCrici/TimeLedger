import { Menu, Sun, Moon, Bell, LogOut } from 'lucide-react';
import { useTheme } from '@/lib/theme/useTheme';
import { useAuth } from '@/lib/auth/useAuth';

interface HeaderProps { onMenuToggle: () => void; title?: string; subtitle?: string; }

export function Header({ onMenuToggle, title, subtitle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-topbar px-5 lg:px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors lg:hidden" aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        {title && (
          <div>
            <h1 className="text-base font-semibold text-primary leading-none">{title}</h1>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors" aria-label="Notificações">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>
        <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors" aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          onClick={logout}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-danger transition-colors"
          aria-label="Sair" title="Sair"
        >
          <LogOut size={16} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-light" title={user?.email}>
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
