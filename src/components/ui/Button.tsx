import { cn } from '@/common/helpers';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-brand text-white hover:bg-brand-dark active:scale-[0.98] shadow-sm shadow-brand/20',
  secondary: 'bg-elevated text-primary border border-border hover:bg-hover active:scale-[0.98]',
  ghost:     'text-secondary hover:bg-hover hover:text-primary active:scale-[0.98]',
  danger:    'bg-danger/10 text-danger hover:bg-danger/20 active:scale-[0.98]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading = false, icon, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      {children}
    </button>
  );
}
