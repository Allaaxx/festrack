import {
  addHours,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachHourOfInterval,
  format,
  getHours,
  getMinutes,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { useMemo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { useCurrentTimeIndicator } from '../hooks/use-current-time-indicator';
import { CalendarCell } from './calendar-cell';
import { CalendarEventBlock } from './calendar-event-block';
import {
  EndHour,
  isMultiDayEvent,
  StartHour,
  WeekCellsHeight,
} from './event-calendar';
import { EventItem } from './event-item';

export function DayView({
  currentDate,
  events,
  onEventSelect,
  onEventCreate,
  onEventResize,
  onEventResizeEnd,
}) {
  const hours = useMemo(() => {
    const dayStart = startOfDay(currentDate);

    return eachHourOfInterval({
      start: addHours(dayStart, StartHour),
      end: addHours(dayStart, EndHour - 1),
    });
  }, [currentDate]);

  const dayEvents = useMemo(() => {
    return events
      .filter(
        (event) =>
          isSameDay(currentDate, event.start) ||
          isSameDay(currentDate, event.end) ||
          (currentDate > event.start && currentDate < event.end)
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [currentDate, events]);

  const allDayEvents = useMemo(() => {
    return dayEvents.filter((event) => event.allDay || isMultiDayEvent(event));
  }, [dayEvents]);

  const timeEvents = useMemo(() => {
    return dayEvents.filter(
      (event) => !event.allDay && !isMultiDayEvent(event)
    );
  }, [dayEvents]);

  const positionedEvents = useMemo(() => {
    const result = [];
    const dayStart = startOfDay(currentDate);

    const sortedEvents = [...timeEvents].sort((a, b) => {
      if (a.start < b.start) return -1;
      if (a.start > b.start) return 1;

      return (
        differenceInMinutes(b.end, b.start) -
        differenceInMinutes(a.end, a.start)
      );
    });

    const columns = [];

    sortedEvents.forEach((event) => {
      const adjustedStart = isSameDay(currentDate, event.start)
        ? event.start
        : dayStart;
      const adjustedEnd = isSameDay(currentDate, event.end)
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

      result.push({
        event,
        top,
        height,
        left,
        width,
        zIndex: 10 + columnIndex,
      });
    });

    return result;
  }, [currentDate, timeEvents]);

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  const showAllDaySection = allDayEvents.length > 0;

  const { currentTimePosition, currentTimeVisible } = useCurrentTimeIndicator(
    currentDate,
    'day',
    StartHour,
    EndHour
  );

  return (
    <div data-slot="day-view" className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="flex-1">
        {showAllDaySection && (
          <div className="border-border/70 bg-muted/50 border-t">
            <div className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr]">
              <div className="relative">
                <span className="text-muted-foreground/70 absolute bottom-0 left-0 h-6 w-16 max-w-full pe-2 text-right text-[10px] sm:pe-4 sm:text-xs">
                  Dia todo
                </span>
              </div>
              <div className="border-border/70 relative border-r p-1 last:border-r-0">
                {allDayEvents.map((event) => (
                  <EventItem
                    key={`spanning-${event.id}`}
                    onClick={(e) => handleEventClick(event, e)}
                    event={event}
                    view="month"
                    isFirstDay={isSameDay(currentDate, event.start)}
                    isLastDay={isSameDay(currentDate, event.end)}
                  >
                    <div>{event.title}</div>
                  </EventItem>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="border-border/70 grid flex-1 grid-cols-[3rem_1fr] overflow-hidden border-t sm:grid-cols-[4rem_1fr]">
          {/* Coluna de horas */}
          <div>
            {hours.map((hour, index) => (
              <div
                key={hour.toString()}
                className="border-border/70 relative h-(--week-cells-height) border-b last:border-b-0"
              >
                {index > 0 && (
                  <span className="bg-background text-muted-foreground/70 absolute -top-3 left-0 flex h-6 w-16 max-w-full items-center justify-end pe-2 text-[10px] sm:pe-4 sm:text-xs">
                    {format(hour, 'HH:mm')}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Coluna de eventos */}
          <div className="relative">
            {positionedEvents.map((positionedEvent) => (
              <CalendarEventBlock
                key={positionedEvent.event.id}
                positionedEvent={positionedEvent}
                view="day"
                onEventSelect={onEventSelect}
                onEventResize={onEventResize}
                onEventResizeEnd={onEventResizeEnd}
              />
            ))}

            {currentTimeVisible && (
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

            {/* Células clicáveis e soltáveis para criar ou mover eventos */}
            {hours.map((hour) => {
              const hourValue = getHours(hour);

              return (
                <div
                  key={hour.toString()}
                  className="border-border/70 relative h-(--week-cells-height) border-b last:border-b-0"
                >
                  {[0, 1, 2, 3].map((quarter) => {
                    const slotDate = new Date(currentDate);
                    slotDate.setHours(hourValue, quarter * 15, 0, 0);
                    const cellId = `drop-day-${slotDate.getTime()}`;

                    return (
                      <CalendarCell
                        key={cellId}
                        id={cellId}
                        date={slotDate}
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
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
