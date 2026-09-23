import { useDroppable } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

/**
 * Coluna de dia atuando como container droppable único para o @dnd-kit.
 * Reduz centenas de droppables individuais a 1 por dia.
 */
export function CalendarDayColumn({ day, className, children, ...props }) {
  const { isOver, setNodeRef } = useDroppable({
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
      data-over={isOver || undefined}
      className={cn(
        'relative transition-colors',
        isOver && 'bg-primary/5 ring-primary/20 inset-ring-primary/20 ring-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default CalendarDayColumn;
