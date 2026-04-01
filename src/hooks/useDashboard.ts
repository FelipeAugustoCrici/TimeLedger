import { useState, useEffect } from 'react';
import type { DashboardSummary } from '@/types';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboard(startDate: string, endDate: string) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate || !endDate) return;
    setSummary(null);
    setLoading(true);
    setError(null);
    dashboardService.getSummary(startDate, endDate)
      .then((res) => setSummary(res.data))
      .catch(() => setError('Erro ao carregar resumo.'))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  return { summary, loading, error };
}
