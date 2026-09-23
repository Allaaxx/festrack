import { useDraggable } from '@dnd-kit/core';
import {
  addHours,
  addMinutes,
  isAfter,
  isBefore,
  startOfDay,
  subMinutes,
} from 'date-fns';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { WeekCellsHeight } from './event-calendar';
import { EventItem } from './event-item';

export function CalendarEventBlock({
  positionedEvent,
  view,
  onEventSelect,
  onEventResize,
  onEventResizeEnd,
}) {
  const { event, top, height, left, width, zIndex } = positionedEvent;

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: {
      event,
    },
    disabled: isResizing,
  });

  const handlePointerDown = (e, type) => {
    e.stopPropagation();
    e.preventDefault();

    e.currentTarget.setPointerCapture(e.pointerId);

    setIsResizing(true);
    resizeRef.current = {
      type,
      startY: e.clientY,
      initialStart: new Date(event.start),
      initialEnd: new Date(event.end),
      lastDeltaMinutes: 0,
      currentStart: new Date(event.start),
      currentEnd: new Date(event.end),
    };
  };

  const handlePointerMove = (e) => {
    if (!resizeRef.current) return;
    e.stopPropagation();

    const { type, startY, initialStart, initialEnd, lastDeltaMinutes } =
      resizeRef.current;
    const deltaY = e.clientY - startY;

    // WeekCellsHeight = 72px (1 hora) -> 18px (15 minutos)
    const pixelsPerQuarter = WeekCellsHeight / 4;
    const quarterDelta = Math.round(deltaY / pixelsPerQuarter);
    const deltaMinutes = quarterDelta * 15;

    if (deltaMinutes === lastDeltaMinutes) return;
    resizeRef.current.lastDeltaMinutes = deltaMinutes;

    if (type === 'top') {
      let candidateStart = addMinutes(initialStart, deltaMinutes);
      const minPossibleStart = startOfDay(initialStart);
      const maxPossibleStart = subMinutes(initialEnd, 15);

      if (isBefore(candidateStart, minPossibleStart)) {
        candidateStart = minPossibleStart;
      }
      if (isAfter(candidateStart, maxPossibleStart)) {
        candidateStart = maxPossibleStart;
      }

      resizeRef.current.currentStart = candidateStart;
      onEventResize?.(event.id, candidateStart, initialEnd);
    } else if (type === 'bottom') {
      let candidateEnd = addMinutes(initialEnd, deltaMinutes);
      const minPossibleEnd = addMinutes(initialStart, 15);
      const maxPossibleEnd = addHours(startOfDay(initialStart), 24);

      if (isBefore(candidateEnd, minPossibleEnd)) {
        candidateEnd = minPossibleEnd;
      }
      if (isAfter(candidateEnd, maxPossibleEnd)) {
        candidateEnd = maxPossibleEnd;
      }

      resizeRef.current.currentEnd = candidateEnd;
      onEventResize?.(event.id, initialStart, candidateEnd);
    }
  };

  const handlePointerUp = (e) => {
    if (!resizeRef.current) return;
    e.stopPropagation();

    const { currentStart, currentEnd } = resizeRef.current;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignora erro se a captura já tiver sido liberada pelo navegador
    }

    setIsResizing(false);
    const updatedEvent = {
      ...event,
      start: currentStart,
      end: currentEnd,
    };
    resizeRef.current = null;

    onEventResizeEnd?.(updatedEvent);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isResizing && !isDragging) {
      onEventSelect?.(event);
    }
  };

  return (
    <div
      className={cn(
        'group/event-block absolute px-0.5 transition-[opacity,box-shadow]',
        isDragging && 'pointer-events-none opacity-0',
        isResizing && 'ring-primary/40 z-30 rounded-sm ring-2'
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `${left * 100}%`,
        width: `${width * 100}%`,
        zIndex: isResizing ? 30 : zIndex,
      }}
    >
      {/* Alça superior (Top Handle) para redimensionar horário de início */}
      <div
        data-resize-handle="top"
        onPointerDown={(e) => handlePointerDown(e, 'top')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="group/top-handle absolute -top-1.5 right-0 left-0 z-30 flex h-3 cursor-ns-resize touch-none items-center justify-center opacity-0 transition-opacity group-hover/event-block:opacity-100"
        title="Ajustar início"
      >
        <div className="bg-foreground/40 group-hover/top-handle:bg-foreground/80 h-1 w-7 rounded-full shadow-xs transition-colors" />
      </div>

      {/* Corpo arrastável do evento */}
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="h-full w-full cursor-grab select-none active:cursor-grabbing"
      >
        <EventItem event={event} view={view} onClick={handleClick} showTime />
      </div>

      {/* Alça inferior (Bottom Handle) para redimensionar horário de término */}
      <div
        data-resize-handle="bottom"
        onPointerDown={(e) => handlePointerDown(e, 'bottom')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="group/bottom-handle absolute right-0 -bottom-1.5 left-0 z-30 flex h-3 cursor-ns-resize touch-none items-center justify-center opacity-0 transition-opacity group-hover/event-block:opacity-100"
        title="Ajustar término"
      >
        <div className="bg-foreground/40 group-hover/bottom-handle:bg-foreground/80 h-1 w-7 rounded-full shadow-xs transition-colors" />
      </div>
    </div>
  );
}

export default CalendarEventBlock;
