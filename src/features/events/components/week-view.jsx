import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  format,
  getHours,
  getMinutes,
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

import { useCurrentTimeIndicator } from '../hooks/use-current-time-indicator';
import { CalendarCell } from './calendar-cell';
import {
  EndHour,
  isMultiDayEvent,
  StartHour,
  WeekCellsHeight,
} from './event-calendar';
import { EventItem } from './event-item';

export function WeekView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
}) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: weekStart, end: weekEnd });
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
      .filter((event) => event.allDay || isMultiDayEvent(event))
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
    return days.map((day) => {
      const dayEvents = events.filter((event) => {
        if (event.allDay || isMultiDayEvent(event)) return false;

        return (
          isSameDay(day, event.start) ||
          isSameDay(day, event.end) ||
          (event.start < day && event.end > day)
        );
      });

      const sortedEvents = [...dayEvents].sort((a, b) => {
        if (a.start < b.start) return -1;
        if (a.start > b.start) return 1;

        return (
          differenceInMinutes(b.end, b.start) -
          differenceInMinutes(a.end, a.start)
        );
      });

      const positionedEvents = [];
      const dayStart = startOfDay(day);
      const columns = [];

      sortedEvents.forEach((event) => {
        const adjustedStart = isSameDay(day, event.start)
          ? event.start
          : dayStart;
        const adjustedEnd = isSameDay(day, event.end)
          ? event.end
          : addHours(dayStart, 24);

        const startHour =
          getHours(adjustedStart) + getMinutes(adjustedStart) / 60;
        const endHour = getHours(adjustedEnd) + getMinutes(adjustedEnd) / 60;
        const top = (startHour - StartHour) * WeekCellsHeight;
        const height = (endHour - startHour) * WeekCellsHeight;

        let columnIndex = 0;
        let placed = false;

        while (!placed) {
          const col = columns[columnIndex] || [];

          if (col.length === 0) {
            columns[columnIndex] = col;
            placed = true;
          } else {
            const overlaps = col.some((c) =>
              areIntervalsOverlapping(
                { start: adjustedStart, end: adjustedEnd },
                { start: c.event.start, end: c.event.end }
              )
            );

            if (!overlaps) placed = true;
            else columnIndex++;
          }
        }

        const currentColumn = columns[columnIndex] || [];

        columns[columnIndex] = currentColumn;
        currentColumn.push({ event, end: adjustedEnd });

        const width = columnIndex === 0 ? 1 : 1 - columnIndex * 0.1;
        const left = columnIndex === 0 ? 0 : columnIndex * 0.1;

        positionedEvents.push({
          event,
          top,
          height,
          left,
          width,
          zIndex: 10 + columnIndex,
        });
      });

      return positionedEvents;
    });
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
    <div
      data-slot="week-view"
      className="flex h-[calc(100vh-10rem)] min-h-0 flex-col overflow-hidden"
    >
      <div className="bg-background/80 border-border/70 sticky top-0 z-30 grid shrink-0 grid-cols-8 border-b backdrop-blur-md">
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
      <ScrollArea className="flex-1">
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
                          isLastDay={isSameDay(day, event.end)}
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

          {days.map((day, dayIndex) => (
            <div
              key={day.toString()}
              className="border-border/70 relative grid auto-cols-fr border-r last:border-r-0"
              data-today={isToday(day) || undefined}
            >
              {(processedDayEvents[dayIndex] ?? []).map((positionedEvent) => (
                <div
                  key={positionedEvent.event.id}
                  className="absolute z-10 px-0.5"
                  style={{
                    top: `${positionedEvent.top}px`,
                    height: `${positionedEvent.height}px`,
                    left: `${positionedEvent.left * 100}%`,
                    width: `${positionedEvent.width * 100}%`,
                    zIndex: positionedEvent.zIndex,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-full w-full">
                    <EventItem
                      event={positionedEvent.event}
                      view="week"
                      onClick={(e) =>
                        handleEventClick(positionedEvent.event, e)
                      }
                      showTime
                    />
                  </div>
                </div>
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
                    {[0, 1, 2, 3].map((quarter) => (
                      <CalendarCell
                        key={`${hour.toString()}-${quarter}`}
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
                        onClick={() => {
                          const startTime = new Date(day);

                          startTime.setHours(hourValue);
                          startTime.setMinutes(quarter * 15);
                          onEventCreate(startTime);
                        }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
