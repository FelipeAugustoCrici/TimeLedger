import { formatCurrency, formatMinutes } from '@/common/helpers';
import { useCategories, isBillableCategory } from '@/hooks/useCategories';
import type { TimeBlock } from '../types';

interface Props {
  blocks: TimeBlock[];
  todayDate: string;
}

export function SummaryBar({ blocks, todayDate }: Props) {
  const { categories } = useCategories();

  const billable = (b: TimeBlock) => isBillableCategory(categories, b.category);

  const todayBlocks   = blocks.filter((b) => b.date === todayDate);
  const weekBlocks    = blocks;

  const todayMins   = todayBlocks.filter(billable).reduce((a, b) => a + b.totalMinutes, 0);
  const weekMins    = weekBlocks.filter(billable).reduce((a, b) => a + b.totalMinutes, 0);
  const todayAmount = todayBlocks.filter(billable).reduce((a, b) => a + b.totalAmount, 0);
  const weekAmount  = weekBlocks.filter(billable).reduce((a, b) => a + b.totalAmount, 0);

  const stats = [
    { label: 'Horas hoje',      value: formatMinutes(todayMins) },
    { label: 'Horas na semana', value: formatMinutes(weekMins) },
    { label: 'Valor hoje',      value: formatCurrency(todayAmount), green: true },
    { label: 'Valor na semana', value: formatCurrency(weekAmount),  green: true },
    { label: 'Tarefas',         value: String(weekBlocks.length) },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map(({ label, value, green }) => (
        <div key={label} className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3 min-w-[110px]">
          <span className="text-[10px] text-muted uppercase tracking-wide">{label}</span>
          <span className={`text-sm font-semibold tabular-nums ${green ? 'text-success' : 'text-primary'}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
