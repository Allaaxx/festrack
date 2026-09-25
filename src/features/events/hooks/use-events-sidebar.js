import { addDays, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

const getDotColorClass = (color) => {
  switch (color) {
    case 'business':
      return 'bg-violet-400';
    case 'family':
      return 'bg-amber-400';
    case 'personal':
      return 'bg-rose-400';
    case 'holiday':
      return 'bg-emerald-400';
    case 'etc':
    default:
      return 'bg-sky-400';
  }
};

const getEventInitials = (title) => {
  if (!title) return 'E';
  return title.charAt(0).toUpperCase();
};

export function useEventsSidebar({ events = [], onDateChange, sidebarDate }) {
  const dotsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const startDate = startOfDay(event.start);
      const endDate = startOfDay(event.end);
      let current = startDate;

      while (current <= endDate) {
        const dateKey = format(current, 'yyyy-MM-dd');
        const color = getDotColorClass(event.color);

        if (!map.has(dateKey)) {
          map.set(dateKey, { colors: [], moreCount: 0 });
        }

        const dayDots = map.get(dateKey);
        if (dayDots.colors.length < 2) {
          dayDots.colors.push(color);
        } else {
          dayDots.moreCount += 1;
        }

        current = addDays(current, 1);
      }
    });
    return map;
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return events
      .filter(
        (event) =>
          startOfDay(event.start) >= today || startOfDay(event.end) >= today
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events]);

  const currentMonthYear = format(sidebarDate || new Date(), 'MMMM yyyy', {
    locale: ptBR,
  });

  const handleDateSelect = (date) => {
    if (date) onDateChange(date);
  };

  const handleEventClick = (event) => {
    onDateChange(startOfDay(event.start));
  };

  return {
    dotsByDate,
    upcomingEvents,
    currentMonthYear,
    handleDateSelect,
    handleEventClick,
    getDotColorClass,
    getEventInitials,
  };
}
