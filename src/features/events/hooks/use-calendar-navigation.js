import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  isSameMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';

import { VIEW_LABELS } from '../constants';

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export function useCalendarNavigation({
  initialView = 'month',
  view: controlledView,
  onViewChange,
  currentDate: controlledCurrentDate,
  onDateChange,
} = {}) {
  const isControlledDate = controlledCurrentDate !== undefined;
  const isControlledView = controlledView !== undefined;

  const [internalCurrentDate, setInternalCurrentDate] = useState(
    () => new Date()
  );
  const [internalView, setInternalView] = useState(initialView);

  const currentDate = isControlledDate
    ? controlledCurrentDate
    : internalCurrentDate;
  const view = isControlledView ? controlledView : internalView;

  const handleDateChange = (updater) => {
    const nextDate =
      typeof updater === 'function' ? updater(currentDate) : updater;
    if (isControlledDate) {
      onDateChange?.(nextDate);
    } else {
      setInternalCurrentDate(nextDate);
    }
  };

  const handleViewChange = (updater) => {
    const nextView = typeof updater === 'function' ? updater(view) : updater;
    if (isControlledView) {
      onViewChange?.(nextView);
    } else {
      setInternalView(nextView);
    }
  };

  const goToToday = () => handleDateChange(new Date());

  const goToPrevious = () => {
    handleDateChange((current) => {
      if (view === 'month') return subMonths(current, 1);
      if (view === 'week') return subWeeks(current, 1);
      return addDays(current, -1);
    });
  };

  const goToNext = () => {
    handleDateChange((current) => {
      if (view === 'month') return addMonths(current, 1);
      if (view === 'week') return addWeeks(current, 1);
      return addDays(current, 1);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        (e.target instanceof HTMLElement && e.target.closest('[role="dialog"]'))
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          handleViewChange('month');
          break;
        case 's':
          handleViewChange('week');
          break;
        case 'd':
          handleViewChange('day');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const viewTitle = useMemo(() => {
    if (view === 'month') {
      const monthTitle = capitalize(
        format(currentDate, 'MMMM yyyy', { locale: ptBR })
      );
      return {
        mobile: monthTitle,
        desktop: monthTitle,
      };
    }

    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });

      const weekTitle = isSameMonth(start, end)
        ? capitalize(format(start, 'MMMM yyyy', { locale: ptBR }))
        : `${capitalize(format(start, 'MMM', { locale: ptBR }))} - ${capitalize(format(end, 'MMM yyyy', { locale: ptBR }))}`;

      return {
        mobile: weekTitle,
        desktop: weekTitle,
      };
    }

    const fullDayTitle = capitalize(
      format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    );
    const mobileDayTitle = format(currentDate, "d 'de' MMMM", { locale: ptBR });

    return {
      mobile: mobileDayTitle,
      desktop: fullDayTitle,
    };
  }, [currentDate, view]);

  return {
    currentDate,
    view,
    viewTitle,
    viewLabels: VIEW_LABELS,
    goToToday,
    goToPrevious,
    goToNext,
    handleViewChange,
    handleDateChange,
  };
}
