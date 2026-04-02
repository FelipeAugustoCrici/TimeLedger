import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Clock, CheckSquare, DollarSign, TrendingUp, ArrowUpRight, Target, CalendarDays } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, CartesianGrid,
} from 'recharts';
import { SummaryCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { useDashboard } from '@/hooks/useDashboard';
import { useEntries } from '@/hooks/useEntries';
import { useSettings } from '@/lib/settings/useSettings';
import { formatCurrency, formatDecimalHours, formatDate, groupByDay, todayISO, cn } from '@/common/helpers';
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
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5 shadow-[0_2px_16px_rgba(0,0,0,0.3)]">

          {/* Chart header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-primary">Horas por dia</p>
              <p className="text-xs text-muted mt-0.5 capitalize">{monthLabel}</p>
            </div>
            <Link to="/entries" className="flex items-center gap-1 text-xs text-brand-light hover:text-brand transition-colors">
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>

          {/* Top summary strip */}
          {summary && (
            <div className="flex items-center gap-4 mb-4 px-3 py-2.5 rounded-xl bg-elevated/40 border border-border/50">
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted uppercase tracking-wider">Total no mês</p>
                <p className="text-sm font-bold text-primary tabular-nums">{formatDecimalHours(summary.totalHours)}</p>
              </div>
              <div className="h-6 w-px bg-border/60" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted uppercase tracking-wider">Média/dia</p>
                <p className="text-sm font-bold text-primary tabular-nums">{formatDecimalHours(summary.avgHoursPerDay)}</p>
              </div>
              <div className="h-6 w-px bg-border/60" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted uppercase tracking-wider">Dias ativos</p>
                <p className="text-sm font-bold text-primary tabular-nums">{dayGroups.length}</p>
              </div>
              {settings.dailyHoursGoal > 0 && (
                <>
                  <div className="h-6 w-px bg-border/60" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted uppercase tracking-wider">Meta diária</p>
                    <p className="text-sm font-bold text-success tabular-nums">{settings.dailyHoursGoal}h</p>
                  </div>
                </>
              )}
            </div>
          )}

          {dayGroups.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-xs text-muted">Nenhum lançamento no mês</p>
            </div>
          ) : (() => {
              const goal = settings.dailyHoursGoal;
              const chartData = dayGroups.slice().reverse().map((g) => {
                const total = parseFloat((g.totalMinutes / 60).toFixed(2));
                const base  = goal > 0 ? parseFloat(Math.min(total, goal).toFixed(2)) : total;
                const extra = goal > 0 ? parseFloat(Math.max(total - goal, 0).toFixed(2)) : 0;
                return { day: g.date.slice(8), date: g.date, base, extra, total };
              });
              return (
                <>
                  {/* SVG gradient defs */}
                  <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                      <linearGradient id="barGradientGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0.55" />
                      </linearGradient>
                      <linearGradient id="barGradientGreenFaint" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.40" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0.12" />
                      </linearGradient>
                      <linearGradient id="barGradientBrand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.55" />
                      </linearGradient>
                      <linearGradient id="barGradientBrandFaint" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.10" />
                      </linearGradient>
                      <linearGradient id="barGradientWarning" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.55" />
                      </linearGradient>
                      <linearGradient id="barGradientWarningFaint" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(255,255,255,0.04)"
                        strokeDasharray="0"
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: 'var(--color-muted)', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        dy={4}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--color-muted)', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}h`}
                        width={32}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99,102,241,0.08)', radius: 6 }}
                        content={<ChartTooltip goal={goal} />}
                      />
                      {goal > 0 && (
                        <ReferenceLine
                          y={goal}
                          stroke="#22c55e"
                          strokeOpacity={0.5}
                          strokeDasharray="6 4"
                          strokeWidth={1.5}
                          label={{
                            value: `Meta diária — ${goal}h`,
                            position: 'insideTopRight',
                            fontSize: 9,
                            fill: '#22c55e',
                            fillOpacity: 0.8,
                            dy: -6,
                            dx: -4,
                          }}
                        />
                      )}
                      <Bar dataKey="base" stackId="a" maxBarSize={36} radius={[0, 0, 3, 3]}>
                        {chartData.map((d) => {
                          const isToday = d.date === todayISO();
                          const fill = goal > 0
                            ? (isToday ? 'url(#barGradientGreen)' : 'url(#barGradientGreenFaint)')
                            : (isToday ? 'url(#barGradientBrand)' : 'url(#barGradientBrandFaint)');
                          return <Cell key={d.date} fill={fill} />;
                        })}
                      </Bar>
                      <Bar dataKey="extra" stackId="a" maxBarSize={36} radius={[4, 4, 0, 0]}>
                        {chartData.map((d) => (
                          <Cell
                            key={d.date}
                            fill={d.extra > 0
                              ? (d.date === todayISO() ? 'url(#barGradientWarning)' : 'url(#barGradientWarningFaint)')
                              : 'transparent'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex items-center gap-5 mt-3 pt-3 border-t border-border/50">
                    {goal > 0 && <LegendDot color="#22c55e" label="Dentro da meta" />}
                    <LegendDot color="#f59e0b" label="Acima da meta" />
                    <LegendDot color="#818cf8" label="Hoje" />
                  </div>
                </>
              );
            })()}
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

// ─── Chart helpers ────────────────────────────────────────────────────────────

interface ChartPayloadEntry {
  payload: { day: string; date: string; base: number; extra: number; total: number };
}

function ChartTooltip({ active, payload, goal }: { active?: boolean; payload?: ChartPayloadEntry[]; goal: number }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const goalPct = goal > 0 ? Math.round((d.total / goal) * 100) : null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0e1628]/95 backdrop-blur-sm px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-xs min-w-[160px]">
      <p className="font-semibold text-primary mb-2 text-[11px]">{d.date ? formatDate(d.date) : d.day}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-muted">Horas</span>
          <span className="font-bold text-primary tabular-nums">{d.total}h</span>
        </div>
        {d.extra > 0 && (
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted">Acima da meta</span>
            <span className="font-semibold text-warning tabular-nums">+{d.extra}h</span>
          </div>
        )}
        {goalPct !== null && (
          <div className="flex items-center justify-between gap-6 pt-1 mt-0.5 border-t border-white/8">
            <span className="text-muted">% da meta</span>
            <span className={cn(
              'font-bold tabular-nums',
              goalPct >= 100 ? 'text-success' : goalPct >= 75 ? 'text-warning' : 'text-muted',
            )}>
              {goalPct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[10px] text-muted">{label}</span>
    </div>
  );
}
