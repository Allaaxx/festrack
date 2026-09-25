import { DndContext } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

import { EventsSidebar } from '..';
import { EventGap, EventHeight, WeekCellsHeight } from '../constants';
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

const EventCalendar = ({
  events = [],
  initialView = 'month',
  view: controlledView,
  onViewChange,
  currentDate: controlledCurrentDate,
  onDateChange,
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
    events,
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
        <EventsSidebar />
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
