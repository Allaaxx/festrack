import { cn } from '@/lib/utils';

/**
 * Célula pura e leve para seleção e hover de horários de 15 minutos no calendário.
 * Não utiliza hooks de droppable, otimizando massivamente o DOM e o ciclo de renderização.
 */
export function CalendarCell({
  time,
  isDragging = false,
  children,
  className,
  onClick,
}) {
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, '0')}`
      : undefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex h-full cursor-pointer flex-col overflow-hidden px-0.5 py-1 transition-colors sm:px-1',
        !isDragging && 'hover:bg-accent/40 dark:hover:bg-accent/25',
        className
      )}
      title={formattedTime}
    >
      {children}
    </div>
  );
}

export default CalendarCell;
