import { cn } from '@/common/helpers';
import type { TaskStatus } from '@/types';
import { TASK_STATUS_LABELS } from '@/common/constants';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

const variantClasses: Record<BadgeVariant, string> = {
  brand:   'bg-brand/15 text-brand-light',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger:  'bg-danger/15 text-danger',
  info:    'bg-info/15 text-info',
  muted:   'bg-elevated text-muted',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'brand', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}

const taskStatusVariant: Record<TaskStatus, BadgeVariant> = {
  pending:     'muted',
  in_progress: 'warning',
  done:        'success',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={taskStatusVariant[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}
