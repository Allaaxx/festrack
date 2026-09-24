import {
  addHours,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  format,
  getHours,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { EndHour, StartHour } from '../constants';
import {
  calculateDayPositionedEvents,
  isMultiDayEvent,
} from '../helpers/calendar-layout';
import { useCurrentTimeIndicator } from '../hooks/use-current-time-indicator';
import { CalendarCell } from './calendar-cell';
import { CalendarDayColumn } from './calendar-day-column';
import { CalendarEventBlock } from './calendar-event-block';
import { EventItem } from './event-item';

export function WeekView({
  currentDate,
  events,
  dragOverSlot = null,
  onEventSelect,
  onEventCreate,
  onEventResize,
  onEventResizeEnd,
}) {
  const days = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });

    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate]
  );

  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);

    return eachHourOfInterval({
      start: addHours(dayStart, StartHour),
      end: addHours(dayStart, EndHour - 1),
    });
  }, [currentDate]);

  const allDayEvents = useMemo(() => {
    return events
      .filter((event) => isMultiDayEvent(event))
      .filter((event) =>
        days.some(
          (day) =>
            isSameDay(day, event.start) ||
            isSameDay(day, event.end) ||
            (day > event.start && day < event.end)
        )
      );
  }, [events, days]);

  const processedDayEvents = useMemo(() => {
    return days.map((day) =>
      calculateDayPositionedEvents({
        day,
        events,
      })
    );
  }, [days, events]);

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  const showAllDaySection = allDayEvents.length > 0;

  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    'week',
    StartHour,
    EndHour
  );

  return (
    <div data-slot="week-view" className="flex min-h-0 flex-1 flex-col">
      <div className="bg-card border-border/70 sticky top-14 z-30 grid shrink-0 grid-cols-8 rounded-t-lg border-b sm:top-16">
        <div className="text-muted-foreground/70 py-2 text-center text-sm">
          <span className="max-[479px]:sr-only">{format(new Date(), 'O')}</span>
        </div>
        {days.map((day) => (
          <div
            key={day.toString()}
            className="data-today:text-foreground text-muted-foreground/70 py-2 text-center text-sm data-today:font-medium"
            data-today={isToday(day) || undefined}
          >
            <span className="tracking-tighter sm:hidden" aria-hidden="true">
              {format(day, 'EEEEE', { locale: ptBR }).toUpperCase()}{' '}
              {format(day, 'd')}
            </span>
            <span className="capitalize max-sm:hidden">
              {format(day, 'EEE dd', { locale: ptBR })}
            </span>
          </div>
        ))}
      </div>

      {showAllDaySection && (
        <div className="border-border/70 bg-muted/50 shrink-0 border-b">
          <div className="grid grid-cols-8">
            <div className="border-border/70 relative border-r">
              <span className="text-muted-foreground/70 absolute bottom-0 left-0 h-6 w-full pe-2 text-center text-[10px] sm:pe-4 sm:text-xs">
                Dia todo
              </span>
            </div>
            {days.map((day, dayIndex) => {
              const dayAllDayEvents = allDayEvents.filter(
                (event) =>
                  isSameDay(day, event.start) ||
                  (day > event.start && day < event.end) ||
                  isSameDay(day, event.end)
              );

              return (
                <div
                  key={day.toString()}
                  className="border-border/70 relative border-r p-1 last:border-r-0"
                  data-today={isToday(day) || undefined}
                >
                  {dayAllDayEvents.map((event) => {
                    const isFirstDay = isSameDay(day, event.start);
                    const isLastDay = isSameDay(day, event.end);
                    const spansRight = !isLastDay && dayIndex < 6;
                    const spansLeft = !isFirstDay && dayIndex > 0;
                    const isFirstVisibleDay =
                      dayIndex === 0 && isBefore(event.start, weekStart);
                    const shouldShowTitle = isFirstDay || isFirstVisibleDay;

                    return (
                      <EventItem
                        key={`spanning-${event.id}`}
                        onClick={(e) => handleEventClick(event, e)}
                        event={event}
                        view="month"
                        isFirstDay={isFirstDay}
                        isLastDay={isLastDay}
                        spansLeft={spansLeft}
                        spansRight={spansRight}
                      >
                        <div
                          className={cn(
                            'truncate',
                            !shouldShowTitle && 'invisible'
                          )}
                          aria-hidden={!shouldShowTitle}
                        >
                          {event.title}
                        </div>
                      </EventItem>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-8">
          <div className="border-border/70 grid auto-cols-fr border-r">
            {hours.map((hour, index) => (
              <div
                key={hour.toString()}
                className="border-border/70 relative min-h-(--week-cells-height) border-b last:border-b-0"
              >
                {index > 0 && (
                  <span className="bg-background text-muted-foreground/70 absolute -top-3 left-0 flex h-6 w-full items-center justify-end pe-1 text-[10px] sm:pe-2 sm:text-xs">
                    {format(hour, 'HH:mm')}
                  </span>
                )}
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const isTargetDay = dragOverSlot?.dayTimestamp === day.getTime();
            const activeQuarterIndex = isTargetDay
              ? dragOverSlot.quarterIndex
              : null;

            return (
              <CalendarDayColumn
                key={day.toString()}
                day={day}
                activeQuarterIndex={activeQuarterIndex}
                className="border-border/70 grid auto-cols-fr border-r last:border-r-0"
                data-today={isToday(day) || undefined}
              >
                {(processedDayEvents[dayIndex] ?? []).map((positionedEvent) => (
                  <CalendarEventBlock
                    key={positionedEvent.event.id}
                    positionedEvent={positionedEvent}
                    view="week"
                    onEventSelect={onEventSelect}
                    onEventResize={onEventResize}
                    onEventResizeEnd={onEventResizeEnd}
                  />
                ))}

                {currentTimeVisible && isToday(day) && (
                  <div
                    className="pointer-events-none absolute right-0 left-0 z-20"
                    style={{ top: `${currentTimePosition}%` }}
                  >
                    <div className="relative flex items-center">
                      <div className="bg-primary absolute -left-1 h-2 w-2 rounded-full"></div>
                      <div className="bg-primary h-0.5 w-full"></div>
                    </div>
                  </div>
                )}

                {hours.map((hour) => {
                  const hourValue = getHours(hour);

                  return (
                    <div
                      key={hour.toString()}
                      className="border-border/70 relative min-h-(--week-cells-height) border-b last:border-b-0"
                    >
                      {[0, 1, 2, 3].map((quarter) => {
                        const slotDate = new Date(day);
                        slotDate.setHours(hourValue, quarter * 15, 0, 0);

                        return (
                          <CalendarCell
                            key={`slot-${slotDate.getTime()}`}
                            time={hourValue + quarter * 0.25}
                            className={cn(
                              'absolute h-[calc(var(--week-cells-height)/4)] w-full',
                              quarter === 0 && 'top-0',
                              quarter === 1 &&
                                'top-[calc(var(--week-cells-height)/4)]',
                              quarter === 2 &&
                                'top-[calc(var(--week-cells-height)/4*2)]',
                              quarter === 3 &&
                                'top-[calc(var(--week-cells-height)/4*3)]'
                            )}
                            onClick={() => onEventCreate(slotDate)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </CalendarDayColumn>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default WeekView;
