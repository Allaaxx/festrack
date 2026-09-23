import { DragOverlay } from '@dnd-kit/core';
import { differenceInMinutes } from 'date-fns';

import { EventGap, EventHeight, WeekCellsHeight } from '../constants';
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
      ? EventHeight
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
            '--event-height': `${EventHeight}px`,
            '--event-gap': `${EventGap}px`,
            '--week-cells-height': `${cellHeight}px`,
            width: activeDragWidth ? `${activeDragWidth}px` : '180px',
            height: `${overlayHeight}px`,
          }}
          className="bg-card pointer-events-none cursor-grabbing overflow-hidden rounded-sm shadow-md"
        >
          <EventItem
            event={activeEvent}
            view={view}
            showTime={!isMonth}
            isFirstDay
            isLastDay
            isOverlay
          />
        </div>
      ) : null}
    </DragOverlay>
  );
}

export default CalendarDragOverlay;
