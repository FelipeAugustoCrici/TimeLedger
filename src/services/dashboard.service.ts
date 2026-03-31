import type { ApiResponse, DashboardSummary, PeriodFilter } from '@/types';

const BASE = 'http://localhost:8080/api/v1';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('task-manager-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader() },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido');
  return json as T;
}

interface ApiDashboardSummary {
  total_hours: number;
  total_amount: number;
  total_tasks: number;
  avg_hours_per_day: number;
}

export const dashboardService = {
  async getSummary(period: PeriodFilter = 'week'): Promise<ApiResponse<DashboardSummary>> {
    const res = await request<{ data: ApiDashboardSummary }>(`/dashboard?period=${period}`);
    return {
      data: {
        totalHours: res.data.total_hours,
        totalAmount: res.data.total_amount,
        totalTasks: res.data.total_tasks,
        avgHoursPerDay: res.data.avg_hours_per_day,
        period,
      },
      success: true,
    };
  },
};
