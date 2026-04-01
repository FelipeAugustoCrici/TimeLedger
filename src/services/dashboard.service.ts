import type { ApiResponse, DashboardSummary } from '@/types';
import { API_BASE as BASE } from './api';

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
  async getSummary(startDate: string, endDate: string): Promise<ApiResponse<DashboardSummary>> {
    const res = await request<{ data: ApiDashboardSummary }>(`/dashboard?start_date=${startDate}&end_date=${endDate}`);
    return {
      data: {
        totalHours: res.data.total_hours,
        totalAmount: res.data.total_amount,
        totalTasks: res.data.total_tasks,
        avgHoursPerDay: res.data.avg_hours_per_day,
        period: 'month',
      },
      success: true,
    };
  },
};
