import { useDraggable, useDroppable } from '@dnd-kit/core';
import { format, isSameDay, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { EventHeight } from '../constants';
import {
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  sortEvents,
} from '../helpers/calendar-layout';
import { useMonthView } from '../hooks/use-month-view';
import { EventItem } from './event-item';

function MonthDayCell({ day, isCurrentMonth, isToday, children, onClick }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `month-day-${day.getTime()}`,
    data: {
      type: 'month-day',
      dayTimestamp: day.getTime(),
      day,
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-slot="month-day-cell"
      data-today={isToday || undefined}
      data-outside-cell={!isCurrentMonth || undefined}
      data-over={isOver || undefined}
      onClick={onClick}
      className={cn(
        'group border-border/70 data-outside-cell:bg-muted/25 data-outside-cell:text-muted-foreground/70 flex min-h-0 flex-col overflow-visible border-r border-b px-0.5 py-1 transition-colors last:border-r-0 sm:px-1',
        isOver && 'bg-primary/10 ring-primary/20 ring-1'
      )}
    >
      {children}
    </div>
  );
}

function DraggableMonthEvent({
  event,
  isFirstDay,
  isLastDay,
  spansLeft,
  spansRight,
  onClick,
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `month-event-${event.id}`,
    data: {
      event,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'w-full cursor-grab select-none active:cursor-grabbing',
        isDragging && 'pointer-events-none opacity-0'
      )}
    >
      <EventItem
        event={event}
        view="month"
        onClick={onClick}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        spansLeft={spansLeft}
        spansRight={spansRight}
      />
    </div>
  );
}

export function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}) {
  const {
    weeks,
    weekdays,
    openPopoverDay,
    setOpenPopoverDay,
    isMounted,
    contentRef,
    getVisibleEventCount,
    handleEventClick,
    handleCellClick,
  } = useMonthView({ currentDate, onEventSelect, onEventCreate });

  return (
    <div data-slot="month-view" className="flex min-h-0 flex-1 flex-col">
      <div className="bg-card border-border/70 grid shrink-0 grid-cols-7 border-b">
        {weekdays.map((day) => (
          <div
            key={day.full}
            className="text-muted-foreground/70 py-2 text-center text-xs font-medium sm:text-sm"
          >
            <span className="capitalize sm:hidden">{day.short}</span>
            <span className="capitalize max-sm:hidden">{day.full}</span>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr">
        {weeks.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="grid min-h-0 grid-cols-7 [&:last-child>*]:border-b-0"
          >
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(events, day);
              const spanningEvents = getSpanningEventsForDay(events, day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const allDayEvents = [...spanningEvents, ...dayEvents];
              const allEvents = getAllEventsForDay(events, day);

              const isReferenceCell = weekIndex === 0 && dayIndex === 0;

              const visibleCount = isMounted
                ? getVisibleEventCount(allDayEvents.length)
                : undefined;
              const hasMore =
                visibleCount !== undefined &&
                allDayEvents.length > visibleCount;
              const remainingCount = hasMore
                ? allDayEvents.length - visibleCount
                : 0;

              return (
                <MonthDayCell
                  key={day.toString()}
                  day={day}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday(day)}
                  onClick={(event) => handleCellClick(day, event)}
                >
                  <div className="group-data-today:bg-primary group-data-today:text-primary-foreground mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs">
                    {format(day, 'd')}
                  </div>
                  <div
                    ref={isReferenceCell ? contentRef : null}
                    className="min-h-[calc((var(--event-height)+var(--event-gap))*2)] flex-1 overflow-visible"
                  >
                    {sortEvents(allDayEvents).map((event, index) => {
                      const isFirstDay = isSameDay(day, event.start);
                      const isLastDay = isSameDay(day, event.end);
                      const spansRight = !isLastDay && dayIndex < 6;
                      const spansLeft = !isFirstDay && dayIndex > 0;
                      const isHidden =
                        isMounted && !!visibleCount && index >= visibleCount;

                      if (!visibleCount) return null;

                      return (
                        <div
                          key={
                            isFirstDay
                              ? event.id
                              : `spanning-${event.id}-${format(day, 'yyyy-MM-dd')}`
                          }
                          className="w-full aria-hidden:hidden"
                          aria-hidden={isHidden ? 'true' : undefined}
                        >
                          <DraggableMonthEvent
                            event={event}
                            onClick={(e) => handleEventClick(event, e)}
                            isFirstDay={isFirstDay}
                            isLastDay={isLastDay}
                            spansLeft={spansLeft}
                            spansRight={spansRight}
                          />
                        </div>
                      );
                    })}

                    {hasMore && (
                      <Popover
                        open={openPopoverDay === format(day, 'yyyy-MM-dd')}
                        onOpenChange={(open) =>
                          setOpenPopoverDay(
                            open ? format(day, 'yyyy-MM-dd') : null
                          )
                        }
                      >
                        <PopoverTrigger
                          className="focus-visible:border-ring focus-visible:ring-ring/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-(--event-gap) flex h-(--event-height) w-full cursor-pointer items-center overflow-hidden px-1 text-left text-[10px] backdrop-blur-md transition outline-none select-none focus-visible:ring-[3px] sm:px-2 sm:text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>
                            + {remainingCount}{' '}
                            <span className="max-sm:sr-only">mais</span>
                          </span>
                        </PopoverTrigger>
                        <PopoverContent
                          align="center"
                          className="max-w-52 p-3"
                          style={{ '--event-height': `${EventHeight}px` }}
                        >
                          <div className="space-y-2">
                            <div className="text-sm font-medium capitalize">
                              {format(day, 'EEE, d', { locale: ptBR })}
                            </div>
                            <div className="space-y-1">
                              {sortEvents(allEvents).map((event) => (
                                <EventItem
                                  key={event.id}
                                  onClick={(e) => handleEventClick(event, e)}
                                  event={event}
                                  view="month"
                                  isFirstDay={isSameDay(day, event.start)}
                                  isLastDay={isSameDay(day, event.end)}
                                />
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </MonthDayCell>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonthView;
