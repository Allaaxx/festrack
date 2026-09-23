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
  return (
    <DragOverlay dropAnimation={null}>
      {activeEvent ? (
        <div
          style={{
            width: activeDragWidth ? `${activeDragWidth}px` : '180px',
            height: `${Math.max(
              (differenceInMinutes(activeEvent.end, activeEvent.start) / 60) *
                cellHeight,
              24
            )}px`,
          }}
          className="pointer-events-none cursor-grabbing opacity-100 shadow-lg"
        >
          <EventItem event={activeEvent} view={view} showTime />
        </div>
      ) : null}
    </DragOverlay>
  );
}

export default CalendarDragOverlay;
