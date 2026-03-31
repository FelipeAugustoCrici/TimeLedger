import { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import moment from 'moment/min/moment-with-locales';
import { Button } from '@/components/ui/Button';
import { cn } from '@/common/helpers';
import { SummaryBar } from '../components/SummaryBar';
import { BlockDrawer } from '../components/BlockDrawer';
import { TimeBlockCard } from '../components/TimeBlock';
import { GridCell } from '../components/GridCell';
import { useTimeGrid, SLOTS_START, SLOTS_END, slotToTime } from '../hooks/useTimeGrid';
import { useCategories } from '@/hooks/useCategories';
import { BLOCK_TYPE_CONFIG } from '../types';
import type { BlockType } from '../types';

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const SLOT_HEIGHT = 28; // px per 30min slot

export default function TimeGridPage() {
  const [weekStart, setWeekStart] = useState(() =>
    moment().startOf('isoWeek').format('YYYY-MM-DD')
  );
  const todayDate = moment().format('YYYY-MM-DD');

  const {
    blocks, loading, selection, drawerOpen, editingBlock,
    startSelection, extendSelection, confirmSelection, cancelSelection,
    updateSelection, openBlock, saveBlock, removeBlock,
  } = useTimeGrid(weekStart);

  const { categories } = useCategories();

  const getCategoryColor = (name?: string) =>
    categories.find((c) => c.name === name)?.color ?? '#6366f1';

  const [isDragging, setIsDragging] = useState(false);
  const hasMoved = useRef(false);

  const weekDates = Array.from({ length: 7 }, (_, i) =>
    moment(weekStart).add(i, 'days').format('YYYY-MM-DD')
  );

  const slots = Array.from({ length: SLOTS_END - SLOTS_START }, (_, i) => SLOTS_START + i);

  const handleMouseDown = useCallback((date: string, slot: number) => {
    setIsDragging(true);
    hasMoved.current = false;
    startSelection(date, slot);
  }, [startSelection]);

  const handleMouseEnter = useCallback((slot: number) => {
    if (isDragging) {
      hasMoved.current = true;
      extendSelection(slot);
    }
  }, [isDragging, extendSelection]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      confirmSelection();
    }
  }, [isDragging, confirmSelection]);

  const prevWeek = () => setWeekStart(moment(weekStart).subtract(1, 'week').format('YYYY-MM-DD'));
  const nextWeek = () => setWeekStart(moment(weekStart).add(1, 'week').format('YYYY-MM-DD'));
  const goToday  = () => setWeekStart(moment().startOf('isoWeek').format('YYYY-MM-DD'));

  const weekLabel = `${moment(weekStart).format('D MMM')} – ${moment(weekStart).endOf('isoWeek').format('D MMM YYYY')}`;

  return (
    <div className="flex flex-col gap-4 h-full" onMouseUp={handleMouseUp} onMouseLeave={() => { if (isDragging) { setIsDragging(false); confirmSelection(); } }}>

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<ChevronLeft size={14} />} onClick={prevWeek} />
          <Button variant="secondary" size="sm" onClick={goToday} icon={<CalendarDays size={14} />}>Hoje</Button>
          <Button variant="secondary" size="sm" icon={<ChevronRight size={14} />} onClick={nextWeek} />
          <span className="text-sm font-medium text-primary capitalize ml-1">{weekLabel}</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {(Object.entries(BLOCK_TYPE_CONFIG) as [BlockType, typeof BLOCK_TYPE_CONFIG[BlockType]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm border ${cfg.bg} ${cfg.border}`} />
              <span className="text-[11px] text-muted">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <SummaryBar blocks={blocks} todayDate={todayDate} />

      {/* Grid */}
      <div className="flex-1 overflow-auto rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted">Carregando...</div>
        ) : (
          <div className="flex min-w-[640px]">
            {/* Time column */}
            <div className="w-14 shrink-0 border-r border-border">
              {/* Header spacer */}
              <div className="h-10 border-b border-border" />
              {slots.map((slot) => {
                const isHour = (slot % 2) === 0;
                return (
                  <div key={slot} className="h-7 flex items-start justify-end pr-2 border-b border-border/40">
                    {isHour && (
                      <span className="text-[10px] text-muted -mt-2 tabular-nums">{slotToTime(slot)}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {weekDates.map((date, di) => {
              const isToday = date === todayDate;
              const dayBlocks = blocks.filter((b) => b.date === date);
              const dayLabel = moment(date).locale('pt-br').format('ddd D');

              return (
                <div key={date} className={cn('flex-1 min-w-[80px] border-r border-border last:border-r-0', isToday && 'bg-brand/5')}>
                  {/* Day header */}
                  <div className={cn(
                    'h-10 flex flex-col items-center justify-center border-b border-border sticky top-0 z-10',
                    isToday ? 'bg-brand/10' : 'bg-card',
                  )}>
                    <span className={cn('text-[11px] font-semibold capitalize', isToday ? 'text-brand-light' : 'text-secondary')}>
                      {dayLabel}
                    </span>
                  </div>

                  {/* Cells + blocks */}
                  <div className="relative" style={{ height: `${slots.length * SLOT_HEIGHT}px` }}>
                    {/* Cells */}
                    {slots.map((slot) => {
                      const relSlot = slot - SLOTS_START;
                      const isSelected = !!(
                        selection &&
                        selection.date === date &&
                        relSlot >= (selection.startSlot - SLOTS_START) &&
                        relSlot < (selection.endSlot - SLOTS_START)
                      );
                      return (
                        <GridCell
                          key={slot}
                          date={date}
                          slot={slot}
                          isSelected={isSelected}
                          isToday={isToday}
                          onMouseDown={handleMouseDown}
                          onMouseEnter={handleMouseEnter}
                          onMouseUp={handleMouseUp}
                        />
                      );
                    })}

                    {/* Blocks — passa o bloco original com slots absolutos */}
                    {dayBlocks.map((block) => (
                      <TimeBlockCard
                        key={block.id}
                        block={{ ...block, startSlot: block.startSlot - SLOTS_START, endSlot: block.endSlot - SLOTS_START }}
                        categoryColor={getCategoryColor(block.category)}
                        onClick={() => openBlock(block)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer */}
      <BlockDrawer
        open={drawerOpen}
        onClose={cancelSelection}
        selection={selection}
        editingBlock={editingBlock}
        onSave={saveBlock}
        onDelete={removeBlock}
        onUpdateSelection={updateSelection}
      />
    </div>
  );
}
