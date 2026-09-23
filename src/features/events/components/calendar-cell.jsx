import { useDroppable } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

export function CalendarCell({ id, date, time, children, className, onClick }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id || 'cell-unassigned',
    disabled: !id,
    data: {
      timestamp: date ? date.getTime() : undefined,
      date,
    },
  });

  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, '0')}`
      : undefined;

  return (
    <div
      ref={id ? setNodeRef : undefined}
      onClick={onClick}
      className={cn(
        'flex h-full flex-col overflow-hidden px-0.5 py-1 transition-colors sm:px-1',
        isOver &&
          'bg-accent/60 dark:bg-accent/40 border-primary/30 z-20 border-y',
        className
      )}
      title={formattedTime}
    >
      {children}
    </div>
  );
}
