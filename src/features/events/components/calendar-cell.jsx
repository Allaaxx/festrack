import { cn } from '@/lib/utils';

/**
 * Célula pura e leve para seleção e hover de horários de 15 minutos no calendário.
 * Não utiliza hooks de droppable, otimizando massivamente o DOM e o ciclo de renderização.
 */
export function CalendarCell({ time, children, className, onClick }) {
  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, '0')}`
      : undefined;

  const handleClick = (e) => {
    const target = e.target;
    if (
      !e.currentTarget.contains(target) ||
      target.closest('[data-calendar-event]') ||
      target.closest('[data-slot^="popover-"]') ||
      target.closest('[data-slot^="dropdown-menu"]') ||
      target.closest('[data-slot^="dialog"]') ||
      target.closest('[data-slot^="sheet"]') ||
      target.closest('[role="menu"]') ||
      target.closest('[role="dialog"]')
    ) {
      return;
    }
    onClick?.(e);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex h-full cursor-pointer flex-col overflow-hidden px-0.5 py-1 transition-colors sm:px-1',
        className
      )}
      title={formattedTime}
    >
      {children}
    </div>
  );
}

export default CalendarCell;
