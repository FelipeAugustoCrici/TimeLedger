import type { TaskStatus, PeriodFilter } from '@/types';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending:     'Pendente',
  in_progress: 'Em andamento',
  done:        'Concluída',
};

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending',     label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done',        label: 'Concluída' },
];

export const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week',  label: 'Semana atual' },
  { value: 'month', label: 'Mês atual' },
  { value: 'custom', label: 'Personalizado' },
];

export const THEME_STORAGE_KEY = 'task-manager-theme';
export const SETTINGS_STORAGE_KEY = 'task-manager-settings';

export const DEFAULT_SETTINGS = {
  hourlyRate: 120,
  dailyHoursGoal: 8,
  monthlyGoal: 0,
} as const;
