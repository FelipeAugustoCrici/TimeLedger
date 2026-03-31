import { useState, useEffect } from 'react';
import { X, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useSettings } from '@/lib/settings/useSettings';
import { useCategories } from '@/hooks/useCategories';
import { formatMinutes, formatCurrency } from '@/common/helpers';
import { slotToTime, timeToSlot, timeDiffMinutes } from '../hooks/useTimeGrid';
import { BLOCK_TYPE_CONFIG } from '../types';
import type { TimeBlock, TimeBlockFormData, BlockType, SelectionState } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  selection: SelectionState | null;
  editingBlock: TimeBlock | null;
  onSave: (form: TimeBlockFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdateSelection: (startSlot: number, endSlot: number) => void;
}

const EMPTY: TimeBlockFormData = {
  taskCode: '', description: '', type: 'work',
  category: '', project: '', notes: '', hourlyRate: 0, status: 'done',
  startTime: '', endTime: '',
};

export function BlockDrawer({ open, onClose, selection, editingBlock, onSave, onDelete, onUpdateSelection }: Props) {
  const { settings } = useSettings();
  const { categories } = useCategories();
  const [form, setForm] = useState<TimeBlockFormData>({ ...EMPTY, hourlyRate: settings.hourlyRate });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingBlock) {
      setForm({
        taskCode: editingBlock.taskCode, description: editingBlock.description,
        type: editingBlock.type, category: editingBlock.category ?? '',
        project: editingBlock.project ?? '', notes: editingBlock.notes ?? '',
        hourlyRate: editingBlock.hourlyRate, status: editingBlock.status,
        startTime: editingBlock.startTime,
        endTime:   editingBlock.endTime,
      });
    } else {
      const startTime = selection ? slotToTime(selection.startSlot) : '';
      const endTime   = selection ? slotToTime(selection.endSlot)   : '';
      setForm({ ...EMPTY, hourlyRate: settings.hourlyRate, startTime, endTime });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBlock, open, settings.hourlyRate]);

  const set = <K extends keyof TimeBlockFormData>(k: K, v: TimeBlockFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Duração real em minutos (não depende de slots)
  const minutes = form.startTime && form.endTime ? timeDiffMinutes(form.startTime, form.endTime) : 0;
  const preview = ((minutes / 60) * form.hourlyRate).toFixed(2);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    set('startTime', val);
    if (val) {
      const newStart = timeToSlot(val);
      const newEnd = selection ? Math.max(newStart + 1, selection.endSlot) : newStart + 1;
      onUpdateSelection(newStart, newEnd);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    set('endTime', val);
    if (val) {
      const newEnd = timeToSlot(val);
      const newStart = selection ? Math.min(selection.startSlot, newEnd - 1) : newEnd - 1;
      onUpdateSelection(Math.max(0, newStart), newEnd);
    }
  };

  const handleSave = async () => {
    if (!form.taskCode.trim() || !form.description.trim() || minutes <= 0) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-surface border-l border-border shadow-2xl overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div>
            <p className="text-sm font-semibold text-primary">
              {editingBlock ? 'Editar lançamento' : 'Novo lançamento'}
            </p>
            {form.startTime && form.endTime && (
              <p className="text-xs text-muted mt-0.5">
                {form.startTime} – {form.endTime} · {formatMinutes(minutes)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 p-5 flex-1">

          {/* Período — input livre, aceita qualquer minuto */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-elevated p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} className="text-muted" />
              <span className="text-xs font-medium text-secondary">Período trabalhado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] text-muted uppercase tracking-wide">Início</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={handleStartChange}
                  className="h-9 rounded-lg border bg-card px-2 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                />
              </div>
              <span className="text-muted mt-4">→</span>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] text-muted uppercase tracking-wide">Fim</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={handleEndChange}
                  className="h-9 rounded-lg border bg-card px-2 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                />
              </div>
              <div className="flex flex-col items-center mt-4 min-w-[44px]">
                <span className={`text-xs font-semibold tabular-nums ${minutes > 0 ? 'text-brand-light' : 'text-muted'}`}>
                  {minutes > 0 ? formatMinutes(minutes) : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Type pills */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(BLOCK_TYPE_CONFIG) as [BlockType, typeof BLOCK_TYPE_CONFIG[BlockType]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => set('type', key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  form.type === key ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-elevated text-muted border-border hover:border-border-light'
                }`}>
                {cfg.label}
              </button>
            ))}
          </div>

          <Input label="Código da task" value={form.taskCode} onChange={(e) => set('taskCode', e.target.value)} placeholder="PROJ-001" />
          <Input label="Descrição" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="O que foi feito..." />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Projeto" value={form.project} onChange={(e) => set('project', e.target.value)} placeholder="Ex: FinApp" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary">Categoria</label>
              <div className="flex items-center gap-2">
                {form.category && (
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: categories.find((c) => c.name === form.category)?.color ?? '#6366f1' }}
                  />
                )}
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className="h-9 w-full rounded-lg border bg-elevated px-2 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as TimeBlockFormData['status'])}>
            <option value="done">Concluída</option>
            <option value="in_progress">Em andamento</option>
            <option value="pending">Pendente</option>
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">R$/hora</label>
            <div className="h-9 flex items-center rounded-lg border border-border bg-elevated/50 px-3 text-sm text-muted select-none">
              {formatCurrency(form.hourlyRate)}
            </div>
            <p className="text-[10px] text-muted">Definido nas configurações</p>
          </div>

          <Textarea label="Observações" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Notas adicionais..." />

          <div className="flex items-center justify-between rounded-lg border border-border bg-elevated px-4 py-3">
            <span className="text-sm text-secondary">Valor calculado</span>
            <span className="text-base font-semibold text-brand-light">R$ {preview}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-4 shrink-0">
          <div>
            {editingBlock && onDelete && (
              <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
                className="text-danger/70 hover:text-danger hover:bg-danger/10"
                onClick={() => onDelete(editingBlock.id)}>
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}
              disabled={!form.taskCode.trim() || !form.description.trim() || minutes <= 0}>
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
