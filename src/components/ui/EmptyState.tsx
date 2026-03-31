import { cn } from '@/common/helpers';
import type { ReactNode } from 'react';

interface EmptyStateProps { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string; }

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-20 text-center', className)}>
      {icon && <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-elevated text-muted">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-primary">{title}</p>
        {description && <p className="mt-1 text-xs text-muted max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}
