import { useState, useEffect } from 'react';
import type { DashboardSummary, PeriodFilter } from '@/types';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboard(period: PeriodFilter = 'week') {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(null);
    setLoading(true);
    setError(null);
    dashboardService.getSummary(period)
      .then((res) => setSummary(res.data))
      .catch(() => setError('Erro ao carregar resumo.'))
      .finally(() => setLoading(false));
  }, [period]);

  return { summary, loading, error };
}
