import { useDroppable } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

/**
 * Coluna de dia atuando como container droppable único para o @dnd-kit.
 * Reduz centenas de droppables individuais a 1 por dia.
 */
export function CalendarDayColumn({
  day,
  activeQuarterIndex = null,
  className,
  children,
  ...props
}) {
  const { setNodeRef } = useDroppable({
    id: `day-column-${day.getTime()}`,
    data: {
      type: 'day-column',
      dayTimestamp: day.getTime(),
      day,
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-slot="day-column"
      className={cn('relative', className)}
      {...props}
    >
      {activeQuarterIndex !== null && activeQuarterIndex !== undefined && (
        <div
          data-slot="drop-indicator"
          className="bg-accent/60 dark:bg-accent/40 pointer-events-none absolute right-0 left-0 z-20 rounded-sm transition-all duration-75"
          style={{
            top: `calc(var(--week-cells-height) / 4 * ${activeQuarterIndex})`,
            height: `calc(var(--week-cells-height) / 4)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

export default CalendarDayColumn;
