import { DragOverlay } from '@dnd-kit/core';
import { differenceInMinutes } from 'date-fns';

import { WeekCellsHeight } from '../constants';
import { EventItem } from './event-item';

export function CalendarDragOverlay({
  activeEvent,
  activeDragWidth,
  view,
  cellHeight = WeekCellsHeight,
}) {
  const isMonth = view === 'month';
  const overlayHeight =
    isMonth && activeEvent
      ? 29
      : activeEvent
        ? Math.max(
            (differenceInMinutes(activeEvent.end, activeEvent.start) / 60) *
              cellHeight,
            24
          )
        : 24;

  return (
    <DragOverlay dropAnimation={null}>
      {activeEvent ? (
        <div
          style={{
            width: activeDragWidth ? `${activeDragWidth}px` : '180px',
            height: `${overlayHeight}px`,
          }}
          className="pointer-events-none cursor-grabbing opacity-100 shadow-lg"
        >
          <EventItem
            event={activeEvent}
            view={view}
            showTime={!isMonth}
            isFirstDay
            isLastDay
          />
        </div>
      ) : null}
    </DragOverlay>
  );
}

export default CalendarDragOverlay;
