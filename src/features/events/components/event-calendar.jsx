import { DndContext } from '@dnd-kit/core';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { EventsSidebar } from '..';
import { EventGap, EventHeight, WeekCellsHeight } from '../constants';
import { EVENT_STATUSES } from '../helpers/event';
import { useCalendarDnd } from '../hooks/use-calendar-dnd';
import { useCalendarNavigation } from '../hooks/use-calendar-navigation';
import { CalendarDragOverlay } from './calendar-drag-overlay';
import { CalendarHeader } from './calendar-header';
import { DayView } from './day-view';
import { MonthView } from './month-view';
import { WeekView } from './week-view';

// Re-exportações para preservar compatibilidade retroativa
export {
  DefaultStartHour,
  EndHour,
  EventGap,
  EventHeight,
  StartHour,
  WeekCellsHeight,
} from '../constants';
export {
  calculateDayPositionedEvents,
  getAllEventsForDay,
  getEventsForDay,
  getSpanningEventsForDay,
  isMultiDayEvent,
  sortEvents,
} from '../helpers/calendar-layout';
export {
  getBorderRadiusClasses,
  getEventColorClasses,
  getMonthViewBleedClasses,
  getMonthViewEventPaddingClasses,
} from '../helpers/calendar-styles';
export { EVENT_STATUSES } from '../helpers/event';

const EventCalendar = ({
  events = [],
  initialView = 'month',
  view: controlledView,
  onViewChange,
  currentDate: controlledCurrentDate,
  onDateChange,
  sidebarDate,
  onSidebarDateChange,
  className,
  onEventSelect = () => {},
  onEventCreate = () => {},
  onEventUpdate = () => {},
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const {
    currentDate,
    view,
    viewTitle,
    viewLabels,
    goToToday,
    goToPrevious,
    goToNext,
    handleViewChange,
  } = useCalendarNavigation({
    initialView,
    view: controlledView,
    onViewChange,
    currentDate: controlledCurrentDate,
    onDateChange,
  });

  const handleToggleStatus = (statusKey) => {
    if (statusKey === 'all') {
      setSelectedStatuses([]);
      return;
    }

    setSelectedStatuses((prev) => {
      let next;
      if (prev.includes(statusKey)) {
        next = prev.filter((s) => s !== statusKey);
      } else {
        next = [...prev, statusKey];
      }

      // Se selecionou todos os status disponíveis, reseta para "Todos" (array vazio)
      const allStatusKeys = Object.keys(EVENT_STATUSES);
      if (next.length === allStatusKeys.length) {
        return [];
      }

      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    if (selectedStatuses.length === 0) return events;
    // event.color contains the mapped status key from EVENT_STATUSES
    return events.filter((event) => selectedStatuses.includes(event.color));
  }, [events, selectedStatuses]);

  const {
    calendarEvents,
    activeEvent,
    dragOverSlot,
    activeDragWidth,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    handleEventResize,
    handleEventCommit,
  } = useCalendarDnd({
    events: filteredEvents,
    onEventUpdate,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <CalendarHeader
        view={view}
        viewTitle={viewTitle}
        viewLabels={viewLabels}
        onViewChange={handleViewChange}
        onEventCreate={onEventCreate}
        onToday={goToToday}
        onPrevious={goToPrevious}
        onNext={goToNext}
        events={calendarEvents}
        currentDate={currentDate}
        onDateChange={onDateChange}
        sidebarDate={sidebarDate}
        onSidebarDateChange={onSidebarDateChange}
        selectedStatuses={selectedStatuses}
        onToggleStatus={handleToggleStatus}
      />
      <div className="flex min-h-0 flex-1 flex-row">
        <div
          className={cn(
            'bg-card flex min-h-0 flex-1 flex-col rounded-lg border',
            className
          )}
          style={{
            '--event-height': `${EventHeight}px`,
            '--event-gap': `${EventGap}px`,
            '--week-cells-height': `${WeekCellsHeight}px`,
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={calendarEvents}
                onEventSelect={onEventSelect}
                onEventCreate={onEventCreate}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={calendarEvents}
                dragOverSlot={dragOverSlot}
                onEventSelect={onEventSelect}
                onEventCreate={onEventCreate}
                onEventResize={handleEventResize}
                onEventResizeEnd={handleEventCommit}
              />
            )}
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                events={calendarEvents}
                dragOverSlot={dragOverSlot}
                onEventSelect={onEventSelect}
                onEventCreate={onEventCreate}
                onEventResize={handleEventResize}
                onEventResizeEnd={handleEventCommit}
              />
            )}
          </div>
        </div>
        <EventsSidebar
          currentDate={currentDate}
          onDateChange={onDateChange}
          sidebarDate={sidebarDate}
          onSidebarDateChange={onSidebarDateChange}
          events={calendarEvents}
          onEventCreate={onEventCreate}
        />
      </div>
      <CalendarDragOverlay
        activeEvent={activeEvent}
        activeDragWidth={activeDragWidth}
        view={view}
        cellHeight={WeekCellsHeight}
      />
    </DndContext>
  );
};

export default EventCalendar;
