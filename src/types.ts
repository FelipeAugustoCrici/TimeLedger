// ─── Theme ────────────────────────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type PeriodFilter = 'today' | 'week' | 'month' | 'custom';

// ─── User Settings ────────────────────────────────────────────────────────────
export interface UserSettings {
  hourlyRate: number;       // R$/hora
  dailyHoursGoal: number;   // meta de horas por dia (ex: 8)
  monthlyGoal: number;      // meta de ganho mensal em R$
}

// ─── TaskEntry — entidade principal ──────────────────────────────────────────
export interface TaskEntry {
  id: string;
  date: string;               // ISO date "YYYY-MM-DD"
  task_code: string;
  description: string;
  time_spent_minutes: number;
  hourly_rate: number;
  total_amount: number;
  status: TaskStatus;
  category?: string;
  project?: string;
  notes?: string;
  start_time?: string;        // "HH:MM"
  end_time?: string;          // "HH:MM"
  created_at: string;
  updated_at: string;
}

export interface TaskEntryFormData {
  date: string;
  task_code: string;
  description: string;
  hours: number;
  minutes: number;
  hourly_rate: number;
  status: TaskStatus;
  category?: string;
  project?: string;
  notes?: string;
  start_time?: string;  // "HH:MM"
  end_time?: string;    // "HH:MM"
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalHours: number;
  totalAmount: number;
  totalTasks: number;
  avgHoursPerDay: number;
  period: PeriodFilter;
}

// ─── Grouped views ────────────────────────────────────────────────────────────
export interface DayGroup {
  date: string;
  entries: TaskEntry[];
  totalMinutes: number;
  totalAmount: number;
}

export interface WeekGroup {
  weekLabel: string;
  startDate: string;
  endDate: string;
  entries: TaskEntry[];
  totalMinutes: number;
  totalAmount: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  expires_at: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface EntryFilters {
  period: PeriodFilter;
  startDate?: string;
  endDate?: string;
  status?: TaskStatus | '';
  category?: string;
  project?: string;
  search?: string;
}

// ─── Timer ────────────────────────────────────────────────────────────────────
export type TimerStatus = 'running' | 'paused';

export interface ActiveTimer {
  id: string;
  status: TimerStatus;
  started_at: string | null; // ISO 8601
  elapsed_seconds: number;
  created_at: string;
  updated_at: string;
}
