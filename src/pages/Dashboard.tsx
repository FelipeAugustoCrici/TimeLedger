import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Clock, CheckSquare, DollarSign, TrendingUp, ArrowUpRight, Target, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SummaryCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useDashboard } from '@/hooks/useDashboard';
import { useEntries } from '@/hooks/useEntries';
import { useSettings } from '@/lib/settings/useSettings';
import { formatCurrency, formatDecimalHours, formatDate, groupByDay, todayISO, cn } from '@/common/helpers';
import { formatDateFull } from '@/lib/dateUtils';
import { TaskStatusBadge } from '@/components/ui/Badge';
import { useCategories, isBillableCategory } from '@/hooks/useCategories';
import moment from 'moment/min/moment-with-locales';

export default function Dashboard() {
  const { monthOffset } = useOutletContext<{ monthOffset: number }>();

  const monthStart = moment().add(monthOffset, 'months').startOf('month');
  const startDate  = monthStart.format('YYYY-MM-DD');
  const endDate    = monthStart.clone().endOf('month').format('YYYY-MM-DD');
  const monthLabel = monthStart.locale('pt-br').format('MMMM [de] YYYY');

  const { settings } = useSettings();
  const { summary, loading } = useDashboard(startDate, endDate);
  const { entries } = useEntries({ period: 'custom', startDate, endDate });
  const { entries: todayEntries } = useEntries({ period: 'today' });
  const { categories } = useCategories();

  const dayGroups = groupByDay(entries).map((g) => ({
    ...g,
    totalMinutes: g.entries
      .filter((e) => isBillableCategory(categories, e.category))
      .reduce((acc, e) => acc + e.time_spent_minutes, 0),
    totalAmount: g.entries
      .filter((e) => isBillableCategory(categories, e.category))
      .reduce((acc, e) => acc + e.total_amount, 0),
  }));

  // Progresso do dia atual (apenas billable)
  const todayMinutes = todayEntries
    .filter((e) => isBillableCategory(categories, e.category))
    .reduce((acc, e) => acc + e.time_spent_minutes, 0);
  const goalMinutes  = settings.dailyHoursGoal * 60;
  const todayPct     = goalMinutes > 0 ? Math.min((todayMinutes / goalMinutes) * 100, 100) : 0;
  const todayDone    = todayMinutes >= goalMinutes;
  const remaining    = Math.max(goalMinutes - todayMinutes, 0);

  // Nome do mês atual

  if (loading) return <PageLoader />;

  const cards = summary ? [
    { title: 'Horas no mês',   value: formatDecimalHours(summary.totalHours),     icon: <Clock size={18} />,       trend: monthLabel },
    { title: 'Lançamentos',    value: String(summary.totalTasks),                 icon: <CheckSquare size={18} />, trend: monthLabel },
    { title: 'Valor total',    value: formatCurrency(summary.totalAmount),        icon: <DollarSign size={18} />,  trend: monthLabel, trendUp: true },
    { title: 'Média por dia',  value: formatDecimalHours(summary.avgHoursPerDay), icon: <TrendingUp size={18} />,  trend: 'Dias com lançamento' },
  ] : [];

  return (
    <div className="flex flex-col gap-8">

      {/* Mês — label */}
      <div className="flex items-center gap-2">
        <CalendarDays size={15} className="text-muted" />
        <span className="text-sm text-muted capitalize">{monthLabel}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <SummaryCard key={card.title} {...card} />)}
      </div>

      {/* Meta do dia */}
      <div className={cn(
        'rounded-xl border p-5 flex flex-col gap-3',
        todayDone ? 'border-success/30 bg-success/5' : 'border-border bg-card',
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              todayDone ? 'bg-success/15 text-success' : 'bg-brand/10 text-brand-light',
            )}>
              <Target size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">
                Meta de hoje — {formatDate(todayISO())}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {todayDone
                  ? '✓ Meta atingida!'
                  : goalMinutes === 0
                    ? 'Configure sua meta diária nas configurações'
                    : `Faltam ${formatDecimalHours(remaining / 60)} de ${settings.dailyHoursGoal}h`
                }
              </p>
            </div>
          </div>
          <span className={cn('text-sm font-semibold tabular-nums', todayDone ? 'text-success' : 'text-primary')}>
            {formatDecimalHours(todayMinutes / 60)} / {settings.dailyHoursGoal}h
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-elevated overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', todayDone ? 'bg-success' : 'bg-brand')}
            style={{ width: `${todayPct}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{todayEntries.length} lançamento{todayEntries.length !== 1 ? 's' : ''} hoje</span>
          <span>·</span>
          <span className="tabular-nums">{formatCurrency(todayEntries.filter((e) => isBillableCategory(categories, e.category)).reduce((a, e) => a + e.total_amount, 0))} acumulado</span>
          <span>·</span>
          <span>{Math.round(todayPct)}% da meta</span>
        </div>
      </div>

      {/* Gráfico de horas por dia no mês */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-primary">Horas por dia</p>
              <p className="text-xs text-muted mt-0.5 capitalize">{monthLabel}</p>
            </div>
            <Link to="/entries" className="flex items-center gap-1 text-xs text-brand-light hover:text-brand transition-colors">
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>

          {dayGroups.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-xs text-muted">Nenhum lançamento no mês</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={dayGroups.slice().reverse().map((g) => ({
                  day: g.date.slice(8),
                  date: g.date,
                  horas: parseFloat((g.totalMinutes / 60).toFixed(2)),
                }))}
                margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                barCategoryGap="20%"
              >
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                  }}
                  formatter={(value) => [`${value}h`, 'Horas']}
                  labelFormatter={(label, payload) => {
                    const date = payload?.[0]?.payload?.date;
                    return date ? formatDate(date) : label;
                  }}
                />
                <Bar dataKey="horas" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {dayGroups.slice().reverse().map((g) => (
                    <Cell
                      key={g.date}
                      fill={g.date === todayISO() ? '#6366f1' : '#6366f133'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-primary">Status dos lançamentos</p>
            <p className="text-xs text-muted mt-0.5 capitalize">{monthLabel}</p>
          </div>
          {entries.length === 0 ? (
            <div className="flex h-24 items-center justify-center">
              <p className="text-xs text-muted">Sem dados</p>
            </div>
          ) : (() => {
            const done       = entries.filter((e) => e.status === 'done').length;
            const inProgress = entries.filter((e) => e.status === 'in_progress').length;
            const pending    = entries.filter((e) => e.status === 'pending').length;
            const total      = entries.length;
            return (
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Concluídas',   count: done,       color: 'bg-success', pct: Math.round((done / total) * 100) },
                  { label: 'Em andamento', count: inProgress, color: 'bg-warning', pct: Math.round((inProgress / total) * 100) },
                  { label: 'Pendentes',    count: pending,    color: 'bg-muted',   pct: Math.round((pending / total) * 100) },
                ].map(({ label, count, color, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        <span className="text-xs text-secondary">{label}</span>
                      </div>
                      <span className="text-xs font-medium text-primary">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-elevated overflow-hidden">
                      <div className={`h-full rounded-full ${color} opacity-70`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Lançamentos recentes */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-primary">Lançamentos recentes</p>
          <Link to="/entries" className="flex items-center gap-1 text-xs text-brand-light hover:text-brand transition-colors">
            Ver todos <ArrowUpRight size={12} />
          </Link>
        </div>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm text-muted">Nenhum lançamento em {monthLabel}.</p>
            <Link to="/entries" className="text-xs text-brand-light hover:text-brand transition-colors">
              Adicionar primeiro lançamento →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {entries.slice(0, 6).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-brand-light shrink-0">{entry.task_code}</span>
                  <span className="text-sm text-secondary truncate">{entry.description}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted hidden sm:block">{formatDate(entry.date)}</span>
                  <TaskStatusBadge status={entry.status} />
                  <span className="text-xs font-medium text-primary tabular-nums">{formatCurrency(entry.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
