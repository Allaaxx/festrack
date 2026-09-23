import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { EventGap, EventHeight } from '../constants';
import {
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  sortEvents,
} from '../helpers/calendar-layout';
import { useEventVisibility } from '../hooks/use-event-visibility';
import { CalendarCell } from './calendar-cell';
import { EventItem } from './event-item';

export function MonthView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}) {
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const result = [];
    let week = [];

    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);

      if (week.length === 7 || i === days.length - 1) {
        result.push(week);
        week = [];
      }
    }

    return result;
  }, [currentDate]);

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i);
        const full = format(d, 'EEE', { locale: ptBR }).replace('.', '');
        const short = format(d, 'EEEEE', { locale: ptBR });
        return {
          full: full.charAt(0).toUpperCase() + full.slice(1),
          short: short.toUpperCase(),
        };
      }),
    []
  );

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  const [openPopoverDay, setOpenPopoverDay] = useState(null);

  const handleCellClick = (day, event) => {
    const target = event.target;

    if (
      target.closest('[data-calendar-event]') ||
      target.closest('[data-slot^="popover-"]')
    )
      return;

    const startTime = new Date(day);

    startTime.setHours(0, 0, 0, 0);
    onEventCreate(startTime);
  };

  const [isMounted, setIsMounted] = useState(false);

  const { contentRef, getVisibleEventCount } = useEventVisibility({
    eventHeight: EventHeight,
    eventGap: EventGap,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <div data-slot="month-view" className="flex min-h-0 flex-1 flex-col">
      <div className="bg-card border-border/70 sticky top-14 z-30 grid grid-cols-7 rounded-t-lg border-b sm:top-16">
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
                <div
                  key={day.toString()}
                  className="group border-border/70 data-outside-cell:bg-muted/25 data-outside-cell:text-muted-foreground/70 min-h-0 border-r border-b last:border-r-0"
                  data-today={isToday(day) || undefined}
                  data-outside-cell={!isCurrentMonth || undefined}
                >
                  <CalendarCell
                    className="min-h-0 overflow-visible"
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
                            <EventItem
                              event={event}
                              view="month"
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
                  </CalendarCell>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
