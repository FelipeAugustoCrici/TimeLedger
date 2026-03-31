import { cn } from '@/common/helpers';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      {children}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function SummaryCard({ title, value, icon, trend, trendUp }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-secondary">{title}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand-light">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-primary tracking-tight">{value}</p>
        {trend && <p className={cn('mt-1 text-xs', trendUp ? 'text-success' : 'text-muted')}>{trend}</p>}
      </div>
    </div>
  );
}
