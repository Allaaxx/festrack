import { DndContext } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

import { EventsSidebar } from '..';
import { EventGap, EventHeight, WeekCellsHeight } from '../constants';
import { useCalendarDnd } from '../hooks/use-calendar-dnd';
import { useCalendarNavigation } from '../hooks/use-calendar-navigation';
import { useEventTagFilter } from '../hooks/use-event-tag-filter';
import { AgendaView } from './agenda-view';
import { CalendarDragOverlay } from './calendar-drag-overlay';
import { CalendarHeader } from './calendar-header';
import { DayView } from './day-view';
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

  const tagFilter = useEventTagFilter(events);

  const tagFilterProps = {
    showAllTags: tagFilter.showAllTags,
    selectedTags: tagFilter.selectedTags,
    tagOptions: tagFilter.tagOptions,
    onSetShowAllTags: tagFilter.onSetShowAllTags,
    onToggleTagFilter: tagFilter.onToggleTagFilter,
    onAddTagOption: tagFilter.onAddTagOption,
    onRemoveTagOption: tagFilter.onRemoveTagOption,
    // Backward-compatibility aliases
    showAllTypes: tagFilter.showAllTags,
    selectedTypes: tagFilter.selectedTags,
    eventTypeOptions: tagFilter.tagOptions,
    onSetShowAllTypes: tagFilter.onSetShowAllTags,
    onToggleTypeFilter: tagFilter.onToggleTagFilter,
    onAddEventTypeOption: tagFilter.onAddTagOption,
    onRemoveEventTypeOption: tagFilter.onRemoveTagOption,
    tagFilter: tagFilter.tagFilter,
  };

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
    events: tagFilter.filteredEvents,
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
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
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
          {...tagFilterProps}
        />
        <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
          <div
            className={cn(
              'bg-card flex min-h-0 flex-1 flex-col overflow-hidden',
              className
            )}
            style={{
              '--event-height': `${EventHeight}px`,
              '--event-gap': `${EventGap}px`,
              '--week-cells-height': `${WeekCellsHeight}px`,
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
            {...tagFilterProps}
          />
        </div>
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
