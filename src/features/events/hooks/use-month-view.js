import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';

import { EventGap, EventHeight } from '../constants';
import { useEventVisibility } from './use-event-visibility';

export function useMonthView({ currentDate, onEventSelect, onEventCreate }) {
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

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

  const [openPopoverDay, setOpenPopoverDay] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const { contentRef, getVisibleEventCount } = useEventVisibility({
    eventHeight: EventHeight,
    eventGap: EventGap,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  const handleCellClick = (day, event) => {
    const target = event.target;

    if (
      target.closest('[data-calendar-event]') ||
      target.closest('[data-slot^="popover-"]')
    ) {
      return;
    }

    const startTime = new Date(day);
    startTime.setHours(0, 0, 0, 0);
    onEventCreate(startTime);
  };

  return {
    weeks,
    weekdays,
    openPopoverDay,
    setOpenPopoverDay,
    isMounted,
    contentRef,
    getVisibleEventCount,
    handleEventClick,
    handleCellClick,
  };
}
