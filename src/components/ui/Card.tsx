import { cn } from '@/common/helpers';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      {children}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: 'brand' | 'success' | 'warning' | 'info';
}

const accentMap = {
  brand:   { bg: 'bg-brand/12',   text: 'text-brand-light', border: 'hover:border-brand/30',   topBar: 'bg-brand' },
  success: { bg: 'bg-success/12', text: 'text-success',     border: 'hover:border-success/30', topBar: 'bg-success' },
  warning: { bg: 'bg-warning/12', text: 'text-warning',     border: 'hover:border-warning/30', topBar: 'bg-warning' },
  info:    { bg: 'bg-info/12',    text: 'text-info',        border: 'hover:border-info/30',    topBar: 'bg-info' },
};

export function KPICard({ title, value, subtitle, icon, accent = 'brand' }: KPICardProps) {
  const colors = accentMap[accent];
  return (
    <div className={cn(
      'relative rounded-2xl border border-border bg-card overflow-hidden',
      'flex flex-col gap-3 p-5 pt-4',
      'transition-all duration-200 group',
      colors.border,
      'shadow-[0_2px_12px_rgba(0,0,0,0.25)]',
    )}>
      {/* Accent top bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity', colors.topBar)} />

      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">{title}</p>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colors.bg, colors.text)}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-[1.75rem] font-bold text-primary tracking-tight tabular-nums leading-none">{value}</p>
        {subtitle && <p className="mt-1.5 text-xs text-muted leading-snug">{subtitle}</p>}
      </div>
    </div>
  );
}

// Legacy compat
export function SummaryCard({ title, value, icon, trend, trendUp }: {
  title: string; value: string; icon: React.ReactNode; trend?: string; trendUp?: boolean;
}) {
  return <KPICard title={title} value={value} icon={icon} subtitle={trend} trendUp={trendUp} />;
}
