import { useRef } from 'react';

interface Props {
  date: string;
  slot: number;
  isSelected: boolean;
  isToday: boolean;
  onMouseDown: (date: string, slot: number) => void;
  onMouseEnter: (slot: number) => void;
  onMouseUp: () => void;
}

export function GridCell({ date, slot, isSelected, isToday, onMouseDown, onMouseEnter, onMouseUp }: Props) {
  const isHalfHour = slot % 2 === 1;

  return (
    <div
      className={`
        h-7 border-b border-border/40 cursor-pointer select-none transition-colors
        ${isHalfHour ? 'border-dashed' : ''}
        ${isSelected ? 'bg-brand/20' : isToday ? 'hover:bg-brand/10' : 'hover:bg-hover/60'}
      `}
      onMouseDown={() => onMouseDown(date, slot)}
      onMouseEnter={() => onMouseEnter(slot)}
      onMouseUp={onMouseUp}
    />
  );
}
