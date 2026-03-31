import { formatMinutes, formatCurrency } from '@/common/helpers';
import type { TimeBlock as TBlock } from '../types';

interface Props {
  block: TBlock;
  categoryColor?: string; // hex da categoria
  onClick: (block: TBlock) => void;
}

export function TimeBlockCard({ block, categoryColor, onClick }: Props) {
  const color = categoryColor ?? '#6366f1';
  const slots = block.endSlot - block.startSlot;
  const col = block.col ?? 0;
  const totalCols = block.totalCols ?? 1;
  const widthPct = 100 / totalCols;
  const leftPct  = col * widthPct;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(block); }}
      className="absolute rounded-md cursor-pointer overflow-hidden transition-all hover:brightness-110 hover:z-10"
      style={{
        top:             `${block.startSlot * 28}px`,
        height:          `${slots * 28 - 2}px`,
        left:            `calc(${leftPct}% + 2px)`,
        width:           `calc(${widthPct}% - 4px)`,
        zIndex:          5 + col,
        backgroundColor: `${color}26`,       // 15% opacity
        borderLeft:      `3px solid ${color}`,
        borderTop:       `1px solid ${color}40`,
        borderRight:     `1px solid ${color}40`,
        borderBottom:    `1px solid ${color}40`,
      }}
    >
      <div className="flex flex-col h-full px-1.5 py-1 overflow-hidden">
        <span className="text-[10px] font-semibold truncate leading-tight" style={{ color }}>
          {block.taskCode}
        </span>
        {slots > 1 && (
          <span className="text-[9px] text-secondary truncate leading-tight">{block.description}</span>
        )}
        {slots > 2 && (
          <span className="text-[9px] text-muted mt-auto">{formatMinutes(block.totalMinutes)} · {formatCurrency(block.totalAmount)}</span>
        )}
      </div>
    </div>
  );
}
