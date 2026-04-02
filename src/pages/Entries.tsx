import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, SlidersHorizontal, Trash2, ChevronDown, ChevronUp,
  Pencil, FileDown, ChevronLeft, ChevronRight, Play,
  Clock, DollarSign, Hash, TrendingUp, CheckCircle2, AlertCircle, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TaskStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { EntryForm } from '@/components/shared/EntryForm';
import { ExportModal } from '@/components/shared/ExportModal';
import { useEntries } from '@/hooks/useEntries';
import { useToast } from '@/lib/toast/useToast';
import { useCategories, isBillableCategory } from '@/hooks/useCategories';
import { useTimer } from '@/lib/timer/useTimer';
import { useSettings } from '@/lib/settings/useSettings';
import { cn, formatCurrency, formatMinutes, groupByDay } from '@/common/helpers';
import { formatDateLong } from '@/lib/dateUtils';
import { PERIOD_OPTIONS, TASK_STATUS_OPTIONS } from '@/common/constants';
import { taskEntryService } from '@/services/taskEntry.service';
import type { EntryFilters, PeriodFilter, TaskEntry, TaskEntryFormData, TaskStatus } from '@/types';
import moment from 'moment/min/moment-with-locales';

export default function Entries() {
  const [filters, setFilters] = useState<Partial<EntryFilters>>({ period: 'week' });
  const [monthOffset, setMonthOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TaskEntry | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  const toast = useToast();
  const { timer, start } = useTimer();
  const { settings } = useSettings();
  const hasActiveTimer = timer !== null;
  const goalMinutes = settings.dailyHoursGoal * 60;

  const monthStart = moment().add(monthOffset, 'months').startOf('month');
  const monthFilters = filters.period === 'month'
    ? { period: 'custom' as PeriodFilter, startDate: monthStart.format('YYYY-MM-DD'), endDate: monthStart.clone().endOf('month').format('YYYY-MM-DD') }
    : {};

  const activeFilters = useMemo(
    () => ({ ...filters, ...monthFilters, search: search || undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, monthOffset, search],
  );

  const { entries, loading, error, createEntry, updateEntry, deleteEntry } = useEntries(activeFilters);
  const { categories } = useCategories();

  const dayGroups = useMemo(
    () => groupByDay(entries).map((g) => ({
      ...g,
      totalMinutes: g.entries.filter((e) => isBillableCategory(categories, e.category)).reduce((acc, e) => acc + e.time_spent_minutes, 0),
      totalAmount:  g.entries.filter((e) => isBillableCategory(categories, e.category)).reduce((acc, e) => acc + e.total_amount, 0),
    })),
    [entries, categories],
  );

  const [projects, setProjects] = useState<string[]>([]);
  useEffect(() => { taskEntryService.getProjects().then(setProjects).catch(() => {}); }, []);

  const setFilter = <K extends keyof EntryFilters>(key: K, value: EntryFilters[K] | '') =>
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));

  const toggleDay = (date: string) =>
    setExpandedDays((prev) => { const n = new Set(prev); n.has(date) ? n.delete(date) : n.add(date); return n; });

  const handleCreate = async (data: Parameters<typeof createEntry>[0]) => { await createEntry(data); setModalOpen(false); };
  const handleEdit   = (entry: TaskEntry) => setEditingEntry(entry);
  const handleUpdate = async (data: TaskEntryFormData) => { if (!editingEntry) return; await updateEntry(editingEntry.id, data); setEditingEntry(null); };
  const handleDelete = async (id: string) => { await deleteEntry(id); toast.success('Lançamento removido.'); };

  const totalMinutes = entries.filter((e) => isBillableCategory(categories, e.category)).reduce((acc, e) => acc + e.time_spent_minutes, 0);
  const totalAmount  = entries.filter((e) => isBillableCategory(categories, e.category)).reduce((acc, e) => acc + e.total_amount, 0);

  // Weekly insight
  const daysAboveGoal  = goalMinutes > 0 ? dayGroups.filter((g) => g.totalMinutes >= goalMinutes).length : 0;
  const daysBelowGoal  = goalMinutes > 0 ? dayGroups.filter((g) => g.totalMinutes > 0 && g.totalMinutes < goalMinutes).length : 0;
  const avgDailyMinutes = dayGroups.length > 0 ? Math.round(totalMinutes / dayGroups.length) : 0;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Unified toolbar ── */}
      <div className="rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.25)] overflow-hidden">

        {/* Top row: period + actions */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {PERIOD_OPTIONS.filter((p) => p.value !== 'custom').map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setFilter('period', opt.value as PeriodFilter); setMonthOffset(0); }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150',
                  filters.period === opt.value
                    ? 'bg-brand text-white shadow-sm shadow-brand/25'
                    : 'bg-elevated/60 text-secondary border border-border/60 hover:bg-hover hover:text-primary',
                )}
              >
                {opt.label}
              </button>
            ))}
            {filters.period === 'month' && (
              <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-elevated/60 px-2 py-1">
                <button onClick={() => setMonthOffset((o) => o - 1)} className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary transition-colors" aria-label="Mês anterior"><ChevronLeft size={13} /></button>
                <span className="text-xs font-semibold text-primary capitalize px-1 min-w-[80px] text-center">{monthStart.locale('pt-br').format('MMM YYYY')}</span>
                <button onClick={() => setMonthOffset((o) => o + 1)} disabled={monthOffset >= 0} className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Próximo mês"><ChevronRight size={13} /></button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all',
                showFilters
                  ? 'bg-brand/15 text-brand-light border border-brand/25'
                  : 'bg-elevated/60 text-secondary border border-border/60 hover:bg-hover hover:text-primary',
              )}
            >
              <SlidersHorizontal size={13} />
              Filtros
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-elevated/60 text-secondary border border-border/60 hover:bg-hover hover:text-primary transition-all"
            >
              <FileDown size={13} />
              Exportar
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-brand text-white hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20"
            >
              <Plus size={14} />
              Novo lançamento
            </button>
          </div>
        </div>

        {/* Search row */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, descrição ou projeto..."
              className={cn(
                'h-10 w-full rounded-xl border bg-elevated/50 pl-10 pr-4',
                'text-sm text-primary placeholder:text-muted',
                'border-border/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15',
                'transition-all duration-150',
              )}
            />
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 border-t border-border/50 bg-elevated/20 px-4 py-3">
            {[
              { label: 'Status', value: filters.status ?? '', onChange: (v: string) => setFilter('status', v as TaskStatus), options: TASK_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })) },
              { label: 'Projeto', value: filters.project ?? '', onChange: (v: string) => setFilter('project', v), options: projects.map((p) => ({ value: p, label: p })) },
              { label: 'Categoria', value: filters.category ?? '', onChange: (v: string) => setFilter('category', v), options: categories.map((c) => ({ value: c.name, label: c.name })) },
            ].map(({ label, value, onChange, options }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</label>
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-8 rounded-lg border bg-elevated px-2 text-xs text-primary border-border/60 focus:border-brand focus:outline-none"
                >
                  <option value="">Todos</option>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── KPI mini cards ── */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Lançamentos', value: String(entries.length), sub: 'no período', icon: <Hash size={14} />, color: 'text-brand-light', bg: 'bg-brand/10' },
            { label: 'Horas totais', value: formatMinutes(totalMinutes), sub: 'registradas', icon: <Clock size={14} />, color: 'text-info', bg: 'bg-info/10' },
            { label: 'Valor total', value: formatCurrency(totalAmount), sub: 'faturado', icon: <DollarSign size={14} />, color: 'text-success', bg: 'bg-success/10' },
          ].map(({ label, value, sub, icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', bg, color)}>{icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted truncate">{label}</p>
                <p className={cn('text-sm font-bold tabular-nums truncate', color)}>{value}</p>
                <p className="text-[10px] text-muted/60">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento encontrado"
          description="Tente ajustar os filtros ou crie um novo lançamento."
          action={<Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Novo lançamento</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {dayGroups.map((group) => {
            const isExpanded = expandedDays.has(group.date) || dayGroups.length <= 3;
            const pct = goalMinutes > 0 ? (group.totalMinutes / goalMinutes) * 100 : -1;
            const perf: 'above' | 'close' | 'below' | 'none' =
              pct < 0 ? 'none' : pct >= 100 ? 'above' : pct >= 75 ? 'close' : 'below';

            const perfConfig = {
              above: { bar: 'bg-success', text: 'text-success', border: 'border-success/20', bg: 'bg-success/[0.03]', icon: <CheckCircle2 size={13} className="text-success" />, label: 'Meta atingida' },
              close: { bar: 'bg-warning', text: 'text-warning', border: 'border-warning/20', bg: 'bg-warning/[0.03]', icon: <AlertCircle size={13} className="text-warning" />, label: `${Math.round(pct)}% da meta` },
              below: { bar: 'bg-danger',  text: 'text-danger',  border: 'border-danger/15',  bg: 'bg-danger/[0.02]',  icon: <XCircle size={13} className="text-danger/70" />,  label: `${Math.round(pct)}% da meta` },
              none:  { bar: 'bg-brand',   text: 'text-primary', border: 'border-border',      bg: '',                  icon: null,                                               label: '' },
            }[perf];

            return (
              <div
                key={group.date}
                className={cn(
                  'overflow-hidden rounded-2xl border transition-all duration-200',
                  'shadow-[0_2px_10px_rgba(0,0,0,0.2)]',
                  perfConfig.border,
                  perfConfig.bg || 'bg-card',
                )}
              >
                {/* Day header */}
                <button
                  onClick={() => toggleDay(group.date)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Performance indicator dot */}
                    {perf !== 'none' && (
                      <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', {
                        'bg-success/12': perf === 'above',
                        'bg-warning/12': perf === 'close',
                        'bg-danger/10':  perf === 'below',
                      })}>
                        {perfConfig.icon}
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-primary capitalize truncate">{formatDateLong(group.date)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted">{group.entries.length} lançamento{group.entries.length !== 1 ? 's' : ''}</p>
                        {perf !== 'none' && perfConfig.label && (
                          <span className={cn('text-[10px] font-semibold', perfConfig.text)}>· {perfConfig.label}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className={cn('text-sm font-bold tabular-nums', perfConfig.text)}>
                        {formatMinutes(group.totalMinutes)}
                      </p>
                      <p className="text-xs font-semibold text-success tabular-nums">{formatCurrency(group.totalAmount)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                  </div>
                </button>

                {/* Progress bar */}
                {perf !== 'none' && (
                  <div className="h-0.5 w-full bg-elevated/60 overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-500', perfConfig.bar)}
                      style={{ width: `${Math.min(pct, 100)}%`, opacity: 0.7 }}
                    />
                  </div>
                )}

                {/* Entries table */}
                {isExpanded && (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block border-t border-border/50 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-elevated/25">
                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Código</th>
                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Descrição</th>
                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Projeto</th>
                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Tempo</th>
                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Valor</th>
                            <th className="px-5 py-2.5 text-left text-[10px] font-bold text-muted uppercase tracking-wider">Status</th>
                            <th className="px-5 py-2.5 text-right text-[10px] font-bold text-muted uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {group.entries.map((entry) => {
                            const billable = isBillableCategory(categories, entry.category);
                            return (
                              <tr key={entry.id} className="hover:bg-white/[0.025] transition-colors group">
                                <td className="px-5 py-3">
                                  <span className="font-mono text-xs font-semibold text-brand-light bg-brand/8 px-2 py-0.5 rounded-md">{entry.task_code}</span>
                                </td>
                                <td className="px-5 py-3 text-secondary max-w-xs truncate group-hover:text-primary transition-colors">{entry.description}</td>
                                <td className="px-5 py-3 text-muted text-xs">{entry.project ?? '—'}</td>
                                <td className="px-5 py-3 text-secondary text-xs tabular-nums">{formatMinutes(entry.time_spent_minutes)}</td>
                                <td className="px-5 py-3 font-semibold text-primary tabular-nums">{billable ? formatCurrency(entry.total_amount) : '—'}</td>
                                <td className="px-5 py-3"><TaskStatusBadge status={entry.status} /></td>
                                <td className="px-5 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {entry.status === 'in_progress' && (
                                      <Button variant="ghost" size="sm" icon={<Play size={13} fill="currentColor" />} disabled={hasActiveTimer}
                                        onClick={() => start({ initialSeconds: entry.time_spent_minutes * 60, sourceEntry: entry })}
                                        title={hasActiveTimer ? 'Já existe um timer ativo' : 'Iniciar timer'}
                                        className="text-brand/60 hover:text-brand hover:bg-brand/10 disabled:opacity-30"
                                      />
                                    )}
                                    <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => handleEdit(entry)} className="text-secondary hover:text-primary hover:bg-hover" />
                                    <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(entry.id)} className="text-danger/50 hover:text-danger hover:bg-danger/10" />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="flex flex-col divide-y divide-border/40 md:hidden border-t border-border/50">
                      {group.entries.map((entry) => {
                        const billable = isBillableCategory(categories, entry.category);
                        return (
                          <div key={entry.id} className="flex flex-col gap-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-mono text-xs font-semibold text-brand-light">{entry.task_code}</span>
                                <p className="mt-0.5 text-sm text-primary truncate">{entry.description}</p>
                              </div>
                              <TaskStatusBadge status={entry.status} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted">
                              <span className="tabular-nums">{formatMinutes(entry.time_spent_minutes)}</span>
                              <span className="font-semibold text-primary tabular-nums">{billable ? formatCurrency(entry.total_amount) : '—'}</span>
                              <div className="flex items-center gap-1">
                                {entry.status === 'in_progress' && (
                                  <Button variant="ghost" size="sm" icon={<Play size={13} fill="currentColor" />} disabled={hasActiveTimer}
                                    onClick={() => start({ initialSeconds: entry.time_spent_minutes * 60, sourceEntry: entry })}
                                    className="text-brand/60 hover:text-brand hover:bg-brand/10 h-7 w-7 p-0"
                                  />
                                )}
                                <Button variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={() => handleEdit(entry)} className="text-secondary hover:text-primary h-7 w-7 p-0" />
                                <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(entry.id)} className="text-danger/50 hover:text-danger h-7 w-7 p-0" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Weekly insight card ── */}
      {!loading && dayGroups.length >= 3 && goalMinutes > 0 && (
        <WeeklyInsightCard
          daysAboveGoal={daysAboveGoal}
          daysBelowGoal={daysBelowGoal}
          totalDays={dayGroups.length}
          avgDailyMinutes={avgDailyMinutes}
          goalMinutes={goalMinutes}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo lançamento" size="lg">
        <EntryForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>
      <Modal open={!!editingEntry} onClose={() => setEditingEntry(null)} title="Editar lançamento" size="lg">
        {editingEntry && (
          <EntryForm isEditing
            initialData={{
              date: editingEntry.date, task_code: editingEntry.task_code, description: editingEntry.description,
              hours: Math.floor(editingEntry.time_spent_minutes / 60), minutes: editingEntry.time_spent_minutes % 60,
              hourly_rate: editingEntry.hourly_rate, status: editingEntry.status, category: editingEntry.category,
              project: editingEntry.project, notes: editingEntry.notes, start_time: editingEntry.start_time, end_time: editingEntry.end_time,
            }}
            onSubmit={handleUpdate} onCancel={() => setEditingEntry(null)}
          />
        )}
      </Modal>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}

// ─── Weekly Insight Card ──────────────────────────────────────────────────────

interface WeeklyInsightProps {
  daysAboveGoal: number;
  daysBelowGoal: number;
  totalDays: number;
  avgDailyMinutes: number;
  goalMinutes: number;
}

function WeeklyInsightCard({ daysAboveGoal, daysBelowGoal, totalDays, avgDailyMinutes, goalMinutes }: WeeklyInsightProps) {
  const successRate = Math.round((daysAboveGoal / totalDays) * 100);
  const avgVsGoal   = goalMinutes > 0 ? Math.round((avgDailyMinutes / goalMinutes) * 100) : 0;

  const insight =
    successRate >= 80 ? { emoji: '🔥', title: 'Semana excelente!', sub: 'Você atingiu a meta na maioria dos dias.', color: 'text-success', border: 'border-success/20', bg: 'bg-success/[0.04]' } :
    successRate >= 50 ? { emoji: '⚡', title: 'Bom ritmo',         sub: 'Mais da metade dos dias com meta atingida.',  color: 'text-warning', border: 'border-warning/20', bg: 'bg-warning/[0.03]' } :
                        { emoji: '📈', title: 'Há espaço para crescer', sub: 'Tente aumentar o foco nos próximos dias.', color: 'text-brand-light', border: 'border-brand/20', bg: 'bg-brand/[0.03]' };

  return (
    <div className={cn('rounded-2xl border p-5 shadow-[0_2px_10px_rgba(0,0,0,0.2)]', insight.border, insight.bg)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated/60 text-xl shrink-0">
            {insight.emoji}
          </div>
          <div>
            <p className={cn('text-sm font-bold', insight.color)}>{insight.title}</p>
            <p className="text-xs text-muted mt-0.5">{insight.sub}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendingUp size={13} className={insight.color} />
          <span className={cn('text-sm font-bold tabular-nums', insight.color)}>{successRate}%</span>
          <span className="text-xs text-muted">de sucesso</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Dias na meta',    value: String(daysAboveGoal), color: 'text-success' },
          { label: 'Dias abaixo',     value: String(daysBelowGoal), color: 'text-danger' },
          { label: 'Média vs meta',   value: `${avgVsGoal}%`,       color: avgVsGoal >= 100 ? 'text-success' : avgVsGoal >= 75 ? 'text-warning' : 'text-muted' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-elevated/40 border border-border/40 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
            <p className={cn('text-base font-bold tabular-nums', color)}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
