import { useState, useMemo, useEffect } from 'react';
import { Clock } from 'lucide-react';
import type { TaskEntryFormData, TaskStatus } from '@/types';
import { TASK_STATUS_OPTIONS } from '@/common/constants';
import { calcTotalAmount, formatCurrency, todayISO } from '@/common/helpers';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DurationInput } from '@/components/ui/DurationInput';
import { taskEntryService } from '@/services/taskEntry.service';
import { useSettings } from '@/lib/settings/useSettings';
import { useToast } from '@/lib/toast/useToast';
import { useCategories } from '@/hooks/useCategories';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

interface EntryFormProps {
  onSubmit: (data: TaskEntryFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TaskEntryFormData>;
  isEditing?: boolean;
  onSplit?: (data: TaskEntryFormData) => Promise<void>;
  remainingMinutes?: number;
}

export function EntryForm({ onSubmit, onCancel, initialData, isEditing = false, onSplit, remainingMinutes }: EntryFormProps) {
  const { settings } = useSettings();
  const toast = useToast();
  const { categories: dbCategories } = useCategories();
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    taskEntryService.getProjects().then(setProjects).catch(() => {});
  }, []);

  const [startTime, setStartTime] = useState(initialData?.start_time ?? '');
  const [endTime,   setEndTime]   = useState(initialData?.end_time   ?? '');

  const [form, setForm] = useState<TaskEntryFormData>({
    date:        initialData?.date        ?? todayISO(),
    task_code:   initialData?.task_code   ?? '',
    description: initialData?.description ?? '',
    hours:       initialData?.hours       ?? 0,
    minutes:     initialData?.minutes     ?? 0,
    hourly_rate: initialData?.hourly_rate ?? settings.hourlyRate,
    status:      initialData?.status      ?? 'done',
    category:    initialData?.category    ?? '',
    project:     initialData?.project     ?? '',
    notes:       initialData?.notes       ?? '',
    start_time:  initialData?.start_time,
    end_time:    initialData?.end_time,
  });

  // Quando período muda, recalcula horas/minutos automaticamente
  const handlePeriodChange = (start: string, end: string) => {
    if (start) setStartTime(start);
    if (end)   setEndTime(end);
    const s = start || startTime;
    const e = end   || endTime;
    if (s && e) {
      const diff = Math.max(0, timeToMinutes(e) - timeToMinutes(s));
      setForm((prev) => ({
        ...prev,
        hours:      Math.floor(diff / 60),
        minutes:    diff % 60,
        start_time: s,
        end_time:   e,
      }));
    }
  };

  const [errors, setErrors] = useState<Partial<Record<keyof TaskEntryFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  // Cálculo em tempo real
  const previewAmount = useMemo(
    () => calcTotalAmount(form.hours * 60 + form.minutes, form.hourly_rate),
    [form.hours, form.minutes, form.hourly_rate],
  );

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.date) e.date = 'Data obrigatória.';
    if (!form.task_code.trim()) e.task_code = 'Código obrigatório.';
    if (!form.description.trim()) e.description = 'Descrição obrigatória.';
    if (form.hours === 0 && form.minutes === 0) e.hours = 'Informe ao menos 1 minuto.';
    if (form.minutes < 0 || form.minutes > 59) e.minutes = 'Minutos: 0 a 59.';
    if (!form.hourly_rate || form.hourly_rate <= 0) e.hourly_rate = 'Valor/hora obrigatório.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit(form);
      toast.success(isEditing ? 'Lançamento atualizado!' : 'Lançamento salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar lançamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async () => {
    if (!onSplit) return;
    if (!validate()) return;
    setLoading(true);
    try {
      await onSplit(form);
    } catch {
      toast.error('Erro ao dividir lançamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof TaskEntryFormData>(key: K, value: TaskEntryFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Row 1: date + code */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Data"
          type="date"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />
        <Input
          label="Código da task"
          value={form.task_code}
          onChange={(e) => set('task_code', e.target.value)}
          error={errors.task_code}
          placeholder="PROJ-001"
        />
      </div>

      {/* Período opcional */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-elevated/50 p-3">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-muted" />
          <span className="text-xs font-medium text-secondary">Período trabalhado (opcional)</span>
          {startTime && endTime && (
            <span className="ml-auto text-xs font-semibold text-brand-light tabular-nums">
              {Math.floor(Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime)) / 60)}h{' '}
              {Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime)) % 60}m
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] text-muted uppercase tracking-wide">Início</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => handlePeriodChange(e.target.value, '')}
              className="h-9 rounded-lg border bg-card px-2 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
            />
          </div>
          <span className="text-muted mt-4">→</span>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] text-muted uppercase tracking-wide">Fim</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => handlePeriodChange('', e.target.value)}
              className="h-9 rounded-lg border bg-card px-2 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <Input
        label="Descrição"
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        error={errors.description}
        placeholder="O que foi feito..."
      />

      {/* Tempo + valor/hora */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DurationInput
          label="Tempo gasto"
          hours={form.hours}
          minutes={form.minutes}
          onChangeHours={(h) => set('hours', h)}
          onChangeMinutes={(m) => set('minutes', m)}
          error={errors.hours ?? errors.minutes}
          hint={remainingMinutes !== undefined ? `Restam ${remainingMinutes} min` : 'Use Tab para navegar entre horas e minutos'}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary">R$/hora</label>
          <div className="h-9 flex items-center rounded-lg border border-border bg-elevated/50 px-3 text-sm text-muted select-none">
            {formatCurrency(form.hourly_rate)}
          </div>
          <p className="text-[10px] text-muted">Definido nas configurações</p>
        </div>
      </div>

      {/* Preview do valor calculado */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3">
        <span className="text-sm text-secondary">Valor calculado</span>
        <span className="text-base font-semibold text-brand-light">{formatCurrency(previewAmount)}</span>
      </div>

      {/* Row 4: status + project + category */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => set('status', e.target.value as TaskStatus)}
        >
          {TASK_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary">Projeto</label>
          <input
            list="projects-list"
            value={form.project}
            onChange={(e) => set('project', e.target.value)}
            placeholder="Ex: FinApp"
            className="h-9 w-full rounded-lg border bg-elevated px-3 text-sm text-primary placeholder:text-muted border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
          />
          <datalist id="projects-list">
            {projects.map((p) => <option key={p} value={p} />)}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-secondary">Categoria</label>
          <div className="flex items-center gap-2">
            {form.category && (
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: dbCategories.find((c) => c.name === form.category)?.color ?? '#6366f1' }}
              />
            )}
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="h-9 w-full rounded-lg border bg-elevated px-2 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
            >
              <option value="">Sem categoria</option>
              {dbCategories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <Textarea
        label="Observação (opcional)"
        value={form.notes}
        onChange={(e) => set('notes', e.target.value)}
        rows={2}
        placeholder="Notas adicionais..."
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        {onSplit && (
          <Button type="button" variant="secondary" onClick={handleSplit} loading={loading}>Dividir</Button>
        )}
        <Button type="submit" loading={loading}>{isEditing ? 'Salvar alterações' : 'Salvar lançamento'}</Button>
      </div>
    </form>
  );
}
