import { DndContext } from '@dnd-kit/core';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { EventsSidebar } from '..';
import { EventGap, EventHeight, WeekCellsHeight } from '../constants';
import { useCalendarDnd } from '../hooks/use-calendar-dnd';
import { useCalendarNavigation } from '../hooks/use-calendar-navigation';
import { AgendaView } from './agenda-view';
import { CalendarDragOverlay } from './calendar-drag-overlay';
import { CalendarHeader } from './calendar-header';
import { DayView } from './day-view';
import { DEFAULT_EVENT_TAGS } from './event-tag-filter-dropdown';
import { MonthView } from './month-view';
import { WeekView } from './week-view';
import { YearView } from './year-view';

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
  const [showAllTypes, setShowAllTypes] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [customTagOptions, setCustomTagOptions] = useState(() => {
    try {
      const stored = localStorage.getItem('festrack:event_tags');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const allTagOptions = useMemo(
    () => [...DEFAULT_EVENT_TAGS, ...customTagOptions],
    [customTagOptions]
  );

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

  const handleSetShowAllTypes = (showAll) => {
    setShowAllTypes(showAll);
    if (showAll) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(allTagOptions.map((opt) => opt.value));
    }
  };

  const handleToggleTypeFilter = (value, checked) => {
    setShowAllTypes(false);
    setSelectedTypes((prev) => {
      let next;
      if (checked) {
        next = prev.includes(value) ? prev : [...prev, value];
      } else {
        next = prev.filter((v) => v !== value);
      }
      if (next.length === 0 || next.length === allTagOptions.length) {
        setShowAllTypes(true);
        return [];
      }
      return next;
    });
  };

  const handleAddEventTypeOption = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const value = trimmed.toLowerCase().replace(/\s+/g, '-');
    if (allTagOptions.some((opt) => opt.value === value)) return;

    const colorPalette = [
      'bg-indigo-400',
      'bg-teal-400',
      'bg-orange-400',
      'bg-pink-400',
      'bg-cyan-400',
      'bg-lime-400',
    ];
    const color = colorPalette[customTagOptions.length % colorPalette.length];
    const newOption = { value, label: trimmed, dotClass: color };
    setCustomTagOptions((prev) => {
      const next = [...prev, newOption];
      try {
        localStorage.setItem('festrack:event_tags', JSON.stringify(next));
      } catch (err) {
        void err;
      }
      return next;
    });
  };

  const handleRemoveEventTypeOption = (value) => {
    setCustomTagOptions((prev) => {
      const next = prev.filter((opt) => opt.value !== value);
      try {
        localStorage.setItem('festrack:event_tags', JSON.stringify(next));
      } catch (err) {
        void err;
      }
      return next;
    });
    setSelectedTypes((prev) => prev.filter((v) => v !== value));
  };

  const filteredEvents = useMemo(() => {
    if (showAllTypes || selectedTypes.length === 0) return events;
    return events.filter((event) => {
      const eventTag =
        event.tag ||
        event.rawEvent?.tag ||
        event.rawEvent?.category ||
        event.event ||
        event.color ||
        'etc';
      return selectedTypes.includes(eventTag);
    });
  }, [events, showAllTypes, selectedTypes]);

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
        showAllTypes={showAllTypes}
        selectedTypes={selectedTypes}
        eventTypeOptions={allTagOptions}
        onSetShowAllTypes={handleSetShowAllTypes}
        onToggleTypeFilter={handleToggleTypeFilter}
        onAddEventTypeOption={handleAddEventTypeOption}
        onRemoveEventTypeOption={handleRemoveEventTypeOption}
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
            {view === 'year' && (
              <YearView
                currentDate={currentDate}
                events={calendarEvents}
                onEventSelect={onEventSelect}
                onEventCreate={onEventCreate}
              />
            )}
            {view === 'agenda' && (
              <AgendaView
                currentDate={currentDate}
                events={calendarEvents}
                onEventSelect={onEventSelect}
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
          showAllTypes={showAllTypes}
          selectedTypes={selectedTypes}
          eventTypeOptions={allTagOptions}
          onSetShowAllTypes={handleSetShowAllTypes}
          onToggleTypeFilter={handleToggleTypeFilter}
          onAddEventTypeOption={handleAddEventTypeOption}
          onRemoveEventTypeOption={handleRemoveEventTypeOption}
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
