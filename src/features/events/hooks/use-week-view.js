import {
  addHours,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  isSameDay,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { useMemo } from 'react';

import { EndHour, StartHour } from '../constants';
import {
  calculateDayPositionedEvents,
  isMultiDayEvent,
} from '../helpers/calendar-layout';
import { useCurrentTimeIndicator } from './use-current-time-indicator';

export function useWeekView({ currentDate, events, onEventSelect }) {
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

  return {
    days,
    weekStart,
    hours,
    allDayEvents,
    processedDayEvents,
    showAllDaySection,
    currentTimePosition,
    currentTimeVisible,
    handleEventClick,
  };
}
