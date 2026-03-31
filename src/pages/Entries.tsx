import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, SlidersHorizontal, Trash2, ChevronDown, ChevronUp, Pencil, FileDown } from 'lucide-react';
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
import { cn, formatCurrency, formatMinutes, groupByDay } from '@/common/helpers';
import { formatDateLong } from '@/lib/dateUtils';
import { PERIOD_OPTIONS, TASK_STATUS_OPTIONS } from '@/common/constants';
import { taskEntryService } from '@/services/taskEntry.service';
import type { EntryFilters, PeriodFilter, TaskEntry, TaskEntryFormData, TaskStatus } from '@/types';

export default function Entries() {
  const [filters, setFilters] = useState<Partial<EntryFilters>>({ period: 'week' });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TaskEntry | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  const toast = useToast();

  const activeFilters = useMemo(
    () => ({ ...filters, search: search || undefined }),
    [filters, search],
  );

  const { entries, loading, error, createEntry, updateEntry, deleteEntry } = useEntries(activeFilters);
  const { categories } = useCategories();

  const dayGroups = useMemo(
    () =>
      groupByDay(entries).map((g) => ({
        ...g,
        totalMinutes: g.entries
          .filter((e) => isBillableCategory(categories, e.category))
          .reduce((acc, e) => acc + e.time_spent_minutes, 0),
        totalAmount: g.entries
          .filter((e) => isBillableCategory(categories, e.category))
          .reduce((acc, e) => acc + e.total_amount, 0),
      })),
    [entries, categories],
  );

  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    taskEntryService.getProjects().then(setProjects).catch(() => {});
  }, []);

  const setFilter = <K extends keyof EntryFilters>(key: K, value: EntryFilters[K] | '') => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleCreate = async (data: Parameters<typeof createEntry>[0]) => {
    await createEntry(data);
    setModalOpen(false);
  };

  const handleEdit = (entry: TaskEntry) => {
    setEditingEntry(entry);
  };

  const handleUpdate = async (data: TaskEntryFormData) => {
    if (!editingEntry) return;
    await updateEntry(editingEntry.id, data);
    setEditingEntry(null);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    toast.success('Lançamento removido.');
  };

  const totalMinutes = entries
    .filter((e) => isBillableCategory(categories, e.category))
    .reduce((acc, e) => acc + e.time_spent_minutes, 0);
  const totalAmount = entries
    .filter((e) => isBillableCategory(categories, e.category))
    .reduce((acc, e) => acc + e.total_amount, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period pills */}
          {PERIOD_OPTIONS.filter((p) => p.value !== 'custom').map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter('period', opt.value as PeriodFilter)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filters.period === opt.value
                  ? 'bg-brand text-white shadow-sm shadow-brand/20'
                  : 'bg-elevated text-secondary border border-border hover:bg-hover hover:text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<SlidersHorizontal size={14} />}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filtros
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FileDown size={14} />}
            onClick={() => setExportOpen(true)}
          >
            Exportar
          </Button>
          <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
            Novo lançamento
          </Button>
        </div>
      </div>

      {/* Search + filters panel */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou descrição..."
            className="h-9 w-full rounded-lg border bg-elevated pl-9 pr-3 text-sm text-primary placeholder:text-muted border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary">Status</label>
              <select
                value={filters.status ?? ''}
                onChange={(e) => setFilter('status', e.target.value as TaskStatus)}
                className="h-8 rounded-lg border bg-elevated px-2 text-xs text-primary border-border focus:border-brand focus:outline-none"
              >
                <option value="">Todos</option>
                {TASK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary">Projeto</label>
              <select
                value={filters.project ?? ''}
                onChange={(e) => setFilter('project', e.target.value)}
                className="h-8 rounded-lg border bg-elevated px-2 text-xs text-primary border-border focus:border-brand focus:outline-none"
              >
                <option value="">Todos</option>
                {projects.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary">Categoria</label>
              <select
                value={filters.category ?? ''}
                onChange={(e) => setFilter('category', e.target.value)}
                className="h-8 rounded-lg border bg-elevated px-2 text-xs text-primary border-border focus:border-brand focus:outline-none"
              >
                <option value="">Todas</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary bar */}
      {entries.length > 0 && (
        <div className="flex items-center gap-6 rounded-xl border border-border bg-card px-5 py-3">
          <div className="text-xs text-muted">
            <span className="font-semibold text-primary text-sm">{entries.length}</span> lançamentos
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="text-xs text-muted">
            <span className="font-semibold text-primary text-sm">{formatMinutes(totalMinutes)}</span> total
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="text-xs text-muted">
            <span className="font-semibold text-success text-sm">{formatCurrency(totalAmount)}</span> valor
          </div>
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
        <div className="flex flex-col gap-3">
          {dayGroups.map((group) => {
            const isExpanded = expandedDays.has(group.date) || dayGroups.length <= 3;
            return (
              <div key={group.date} className="overflow-hidden rounded-xl border border-border bg-card">
                {/* Day header */}
                <button
                  onClick={() => toggleDay(group.date)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-hover/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-sm font-semibold text-primary capitalize">
                        {formatDateLong(group.date)}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{group.entries.length} lançamento{group.entries.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-primary">{formatMinutes(group.totalMinutes)}</p>
                      <p className="text-xs text-success">{formatCurrency(group.totalAmount)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
                  </div>
                </button>

                {/* Entries table */}
                {isExpanded && (
                  <>
                    {/* Desktop */}
                    <div className="hidden md:block border-t border-border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-elevated/40">
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Código</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Descrição</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Projeto</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Tempo</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Valor</th>
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                            <th className="px-5 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {group.entries.map((entry) => {
                            const billable = isBillableCategory(categories, entry.category);
                            return (
                            <tr key={entry.id} className="hover:bg-hover/40 transition-colors">
                              <td className="px-5 py-3.5">
                                <span className="font-mono text-xs text-brand-light">{entry.task_code}</span>
                              </td>
                              <td className="px-5 py-3.5 text-secondary max-w-xs truncate">{entry.description}</td>
                              <td className="px-5 py-3.5 text-muted text-xs">{entry.project ?? '—'}</td>
                              <td className="px-5 py-3.5 text-secondary">{formatMinutes(entry.time_spent_minutes)}</td>
                              <td className="px-5 py-3.5 font-medium text-primary">{billable ? formatCurrency(entry.total_amount) : '—'}</td>
                              <td className="px-5 py-3.5"><TaskStatusBadge status={entry.status} /></td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost" size="sm" icon={<Pencil size={13} />}
                                    onClick={() => handleEdit(entry)}
                                    className="text-secondary hover:text-primary hover:bg-hover"
                                  />
                                  <Button
                                    variant="ghost" size="sm" icon={<Trash2 size={13} />}
                                    onClick={() => handleDelete(entry.id)}
                                    className="text-danger/60 hover:text-danger hover:bg-danger/10"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="flex flex-col divide-y divide-border md:hidden border-t border-border">
                      {group.entries.map((entry) => {
                        const billable = isBillableCategory(categories, entry.category);
                        return (
                        <div key={entry.id} className="flex flex-col gap-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-mono text-xs text-brand-light">{entry.task_code}</span>
                              <p className="mt-0.5 text-sm text-primary truncate">{entry.description}</p>
                            </div>
                            <TaskStatusBadge status={entry.status} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>{formatMinutes(entry.time_spent_minutes)}</span>
                            <span className="font-medium text-primary">{billable ? formatCurrency(entry.total_amount) : '—'}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="sm" icon={<Pencil size={13} />}
                                onClick={() => handleEdit(entry)}
                                className="text-secondary hover:text-primary h-7 w-7 p-0"
                              />
                              <Button
                                variant="ghost" size="sm" icon={<Trash2 size={13} />}
                                onClick={() => handleDelete(entry.id)}
                                className="text-danger/60 hover:text-danger h-7 w-7 p-0"
                              />
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo lançamento" size="lg">
        <EntryForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={!!editingEntry} onClose={() => setEditingEntry(null)} title="Editar lançamento" size="lg">
        {editingEntry && (
          <EntryForm
            isEditing
            initialData={{
              date:        editingEntry.date,
              task_code:   editingEntry.task_code,
              description: editingEntry.description,
              hours:       Math.floor(editingEntry.time_spent_minutes / 60),
              minutes:     editingEntry.time_spent_minutes % 60,
              hourly_rate: editingEntry.hourly_rate,
              status:      editingEntry.status,
              category:    editingEntry.category,
              project:     editingEntry.project,
              notes:       editingEntry.notes,
              start_time:  editingEntry.start_time,
              end_time:    editingEntry.end_time,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingEntry(null)}
          />
        )}
      </Modal>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
