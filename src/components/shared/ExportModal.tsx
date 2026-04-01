import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn, formatMinutes, formatCurrency } from '@/common/helpers';
import { todayISO, formatDateShort } from '@/lib/dateUtils';
import { taskEntryService } from '@/services/taskEntry.service';
import { categoryService, type Category } from '@/services/category.service';
import type { TaskEntry } from '@/types';
import moment from 'moment/min/moment-with-locales';

type ExportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type ExportFormat = 'csv' | 'message';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PERIOD_OPTIONS: { value: ExportPeriod; label: string }[] = [
  { value: 'today',     label: 'Hoje'          },
  { value: 'yesterday', label: 'Dia anterior'  },
  { value: 'week',      label: 'Esta semana'   },
  { value: 'month',     label: 'Este mês'      },
  { value: 'custom',    label: 'Personalizado' },
];

function getRange(period: ExportPeriod, customStart: string, customEnd: string) {
  const today = moment();
  switch (period) {
    case 'today': {
      const d = today.format('YYYY-MM-DD');
      return { startDate: d, endDate: d };
    }
    case 'yesterday': {
      const d = moment().subtract(1, 'day').format('YYYY-MM-DD');
      return { startDate: d, endDate: d };
    }
    case 'week':
      return {
        startDate: today.clone().startOf('isoWeek').format('YYYY-MM-DD'),
        endDate:   today.clone().endOf('isoWeek').format('YYYY-MM-DD'),
      };
    case 'month':
      return {
        startDate: today.clone().startOf('month').format('YYYY-MM-DD'),
        endDate:   today.clone().endOf('month').format('YYYY-MM-DD'),
      };
    case 'custom':
      return { startDate: customStart, endDate: customEnd };
  }
}

function isBillable(categories: Category[], name: string | undefined): boolean {
  if (!name) return true;
  const cat = categories.find((c) => c.name === name);
  return cat ? cat.billable : true;
}

function periodLabel(period: ExportPeriod, startDate: string, endDate: string): string {
  if (period === 'yesterday' || startDate === endDate) return `📅 ${formatDateShort(startDate)}`;
  return `📅 ${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
}

function entriesToMessage(entries: TaskEntry[], categories: Category[], period: ExportPeriod, startDate: string, endDate: string): string {
  const billableEntries = entries.filter((e) => isBillable(categories, e.category));
  const totalMinutes = billableEntries.reduce((acc, e) => acc + e.time_spent_minutes, 0);
  const totalAmount  = billableEntries.reduce((acc, e) => acc + e.total_amount, 0);
  const header       = periodLabel(period, startDate, endDate);
  const summary      = `⏱ Total: ${formatMinutes(totalMinutes)} | 💰 ${formatCurrency(totalAmount)}`;

  const byDay = new Map<string, TaskEntry[]>();
  for (const e of billableEntries) {
    if (!byDay.has(e.date)) byDay.set(e.date, []);
    byDay.get(e.date)!.push(e);
  }

  const days = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEntries]) => {
      const dayMinutes = dayEntries.reduce((acc, e) => acc + e.time_spent_minutes, 0);
      const lines = dayEntries.map((e) => `• ${e.task_code} – ${e.description} – ${formatMinutes(e.time_spent_minutes)}`);
      return [`\n*${formatDateShort(date)}* — ${formatMinutes(dayMinutes)}`, ...lines].join('\n');
    });

  return [header, summary, 'Tarefas:', ...days].join('\n');
}

function entriesToCSV(entries: TaskEntry[], categories: Category[]): string {
  const billableEntries = entries.filter((e) => isBillable(categories, e.category));
  const header = ['Data', 'Código', 'Descrição', 'Projeto', 'Categoria', 'Tempo', 'Valor (R$)', 'Status'];
  const rows = billableEntries.map((e) => [
    formatDateShort(e.date),
    e.task_code,
    `"${e.description.replace(/"/g, '""')}"`,
    e.project ?? '',
    e.category ?? '',
    formatMinutes(e.time_spent_minutes),
    e.total_amount.toFixed(2).replace('.', ','),
    e.status,
  ]);
  return [header, ...rows].map((r) => r.join(';')).join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportModal({ open, onClose }: Props) {
  const [period, setPeriod]           = useState<ExportPeriod>('week');
  const [format, setFormat]           = useState<ExportFormat>('csv');
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd]     = useState(todayISO());
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [message, setMessage]         = useState('');
  const [copied, setCopied]           = useState(false);

  const reset = () => { setMessage(''); setError(''); };

  const handleGenerate = async () => {
    reset();
    const { startDate, endDate } = getRange(period, customStart, customEnd);
    if (!startDate || !endDate) { setError('Selecione um período válido.'); return; }
    setLoading(true);
    try {
      const [res, categories] = await Promise.all([
        taskEntryService.listEntries({ period: 'custom', startDate, endDate }),
        categoryService.list(),
      ]);
      if (res.data.length === 0) { setError('Nenhum lançamento encontrado para o período selecionado.'); return; }
      if (format === 'csv') {
        downloadCSV(entriesToCSV(res.data, categories), `lancamentos_${startDate}_${endDate}.csv`);
        onClose();
      } else {
        setMessage(entriesToMessage(res.data, categories, period, startDate, endDate));
      }
    } catch {
      setError('Erro ao buscar lançamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Exportar lançamentos" size="sm">
      <div className="flex flex-col gap-5">

        <div className="flex rounded-lg border border-border bg-elevated p-1 gap-1">
          {(['csv', 'message'] as ExportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFormat(f); reset(); }}
              className={cn(
                'flex-1 rounded-md py-1.5 text-xs font-medium transition-all',
                format === f ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-secondary',
              )}
            >
              {f === 'csv' ? '📄 Planilha (CSV)' : '💬 Mensagem'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setPeriod(opt.value); reset(); }}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left',
                period === opt.value
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border bg-elevated text-secondary hover:bg-hover hover:text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary">De</label>
              <input type="date" value={customStart} max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-9 rounded-lg border bg-elevated px-3 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary">Até</label>
              <input type="date" value={customEnd} min={customStart}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-9 rounded-lg border bg-elevated px-3 text-sm text-primary border-border focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        )}

        {message && (
          <div className="relative rounded-xl border border-border bg-elevated">
            <pre className="whitespace-pre-wrap p-4 pr-20 text-xs text-secondary font-sans leading-relaxed max-h-56 overflow-y-auto">
              {message}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-secondary hover:text-primary transition-colors"
            >
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancelar</Button>
          {message ? (
            <Button icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopy}>
              {copied ? 'Copiado!' : 'Copiar mensagem'}
            </Button>
          ) : (
            <Button
              icon={format === 'csv' ? <Download size={14} /> : undefined}
              onClick={handleGenerate}
              loading={loading}
            >
              {format === 'csv' ? 'Exportar CSV' : 'Gerar mensagem'}
            </Button>
          )}
        </div>

      </div>
    </Modal>
  );
}
