import {
  addHours,
  addMinutes,
  isAfter,
  isBefore,
  startOfDay,
  subMinutes,
} from 'date-fns';
import { useRef, useState } from 'react';

import { MinutesPerQuarter, WeekCellsHeight } from '../constants';

/**
 * Hook para gerenciar o redimensionamento de eventos no calendário via Pointer Events.
 *
 * @param {Object} params
 * @param {Object} params.event
 * @param {number} [params.cellHeight=WeekCellsHeight]
 * @param {number} [params.snapMinutes=MinutesPerQuarter]
 * @param {Function} [params.onEventResize]
 * @param {Function} [params.onEventResizeEnd]
 */
export function useEventResizable({
  event,
  cellHeight = WeekCellsHeight,
  snapMinutes = MinutesPerQuarter,
  onEventResize,
  onEventResizeEnd,
}) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

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

    // cellHeight = 72px (1 hora) -> (72 / 60) * 15 = 18px para 15 minutos
    const pixelsPerStep = (cellHeight / 60) * snapMinutes;
    const stepDelta = Math.round(deltaY / pixelsPerStep);
    const deltaMinutes = stepDelta * snapMinutes;

    if (deltaMinutes === lastDeltaMinutes) return;
    resizeRef.current.lastDeltaMinutes = deltaMinutes;

    if (type === 'top') {
      let candidateStart = addMinutes(initialStart, deltaMinutes);
      const minPossibleStart = startOfDay(initialStart);
      const maxPossibleStart = subMinutes(initialEnd, snapMinutes);

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
      const minPossibleEnd = addMinutes(initialStart, snapMinutes);
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
      // Ignora caso a captura já tenha sido liberada
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

  return {
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
