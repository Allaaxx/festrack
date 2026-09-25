import { addHours, eachHourOfInterval, isSameDay, startOfDay } from 'date-fns';
import { useMemo } from 'react';

import { EndHour, StartHour } from '../constants';
import {
  calculateDayPositionedEvents,
  isMultiDayEvent,
} from '../helpers/calendar-layout';
import { useCurrentTimeIndicator } from './use-current-time-indicator';

export function useDayView({ currentDate, events, onEventSelect }) {
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
      .filter(
        (event) =>
          isSameDay(currentDate, event.start) ||
          isSameDay(currentDate, event.end) ||
          (currentDate > event.start && currentDate < event.end)
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [currentDate, events]);

  const positionedEvents = useMemo(() => {
    return calculateDayPositionedEvents({
      day: currentDate,
      events,
    });
  }, [currentDate, events]);

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

  return {
    hours,
    allDayEvents,
    positionedEvents,
    showAllDaySection,
    currentTimePosition,
    currentTimeVisible,
    handleEventClick,
  };
}
