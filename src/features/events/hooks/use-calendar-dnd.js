import {
  closestCenter,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { addMinutes, differenceInMinutes, startOfDay } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';

import { WeekCellsHeight } from '../constants';

/**
 * Hook para orquestrar o drag and drop e manipulação otimista de eventos do calendário com @dnd-kit.
 * Utiliza a ponta superior do elemento arrastado como referência para cálculo de horários
 * e gerencia colisões em colunas diárias e células mensais com alta performance.
 *
 * @param {Object} params
 * @param {Array} params.events
 * @param {Function} [params.onEventUpdate]
 */
export function useCalendarDnd({ events = [], onEventUpdate }) {
  const [prevEvents, setPrevEvents] = useState(events);
  const [overrides, setOverrides] = useState({});
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeDragWidth, setActiveDragWidth] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  if (prevEvents !== events) {
    setPrevEvents(events);
    setOverrides({});
  }

  const calendarEvents = useMemo(() => {
    if (Object.keys(overrides).length === 0) return events;
    return events.map((event) => {
      const override = overrides[event.id];
      return override ? { ...event, ...override } : event;
    });
  }, [events, overrides]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const collisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  }, []);

  const handleDragStart = useCallback((event) => {
    const evt = event.active.data.current?.event;
    setActiveEvent(evt);
    setDragOverSlot(null);
    if (event.active.rect.current?.initial) {
      setActiveDragWidth(event.active.rect.current.initial.width);
    }
  }, []);

  const handleDragMove = useCallback((event) => {
    const { active, over } = event;
    if (!over || !active) {
      setDragOverSlot(null);
      return;
    }

    const overData = over.data?.current;
    if (overData?.type === 'day-column') {
      const translatedTop = active.rect.current?.translated?.top ?? 0;
      const columnTop = over.rect.top;
      const deltaY = translatedTop - columnTop;

      const pixelsPerQuarter = WeekCellsHeight / 4;
      const rawQuarterIndex = Math.round(deltaY / pixelsPerQuarter);
      const quarterIndex = Math.max(0, Math.min(24 * 4 - 1, rawQuarterIndex));

      setDragOverSlot({
        dayTimestamp: overData.dayTimestamp,
        quarterIndex,
      });
    } else {
      setDragOverSlot(null);
    }
  }, []);

  const handleEventResize = useCallback((eventId, newStart, newEnd) => {
    setOverrides((prev) => ({
      ...prev,
      [eventId]: { start: newStart, end: newEnd },
    }));
  }, []);

  const handleEventCommit = useCallback(
    (updatedEvent) => {
      setOverrides((prev) => ({
        ...prev,
        [updatedEvent.id]: { start: updatedEvent.start, end: updatedEvent.end },
      }));
      onEventUpdate?.(updatedEvent);
    },
    [onEventUpdate]
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveEvent(null);
      setActiveDragWidth(null);
      setDragOverSlot(null);

      if (!over || !active.data?.current?.event) {
        return;
      }

      const draggedEvent = active.data.current.event;
      const overData = over.data?.current;

      // Caso 1: Drop em coluna horária (DayView ou WeekView)
      // O horário é calculado pela ponta superior (top edge) do card arrastado
      if (overData?.type === 'day-column') {
        const dayDate = new Date(overData.dayTimestamp);
        const translatedTop = active.rect.current?.translated?.top ?? 0;
        const columnTop = over.rect.top;
        const deltaY = translatedTop - columnTop;

        const pixelsPerQuarter = WeekCellsHeight / 4; // 18px para 15 minutos
        const quarterIndex = Math.round(deltaY / pixelsPerQuarter);
        const durationMinutes = Math.max(
          15,
          differenceInMinutes(draggedEvent.end, draggedEvent.start)
        );

        // Clamping estrito dentro do mesmo dia (00:00 às 23:59)
        const maxStartMinutes = 24 * 60 - durationMinutes;
        const clampedStartMinutes = Math.max(
          0,
          Math.min(maxStartMinutes, quarterIndex * 15)
        );

        const newStart = addMinutes(startOfDay(dayDate), clampedStartMinutes);
        const newEnd = addMinutes(newStart, durationMinutes);

        handleEventCommit({
          ...draggedEvent,
          start: newStart,
          end: newEnd,
          action: 'move',
        });
        return;
      }

      // Caso 2: Drop em célula de dia da MonthView
      if (overData?.type === 'month-day') {
        const targetDate = new Date(overData.dayTimestamp);
        const originalStart = new Date(draggedEvent.start);
        const durationMinutes = Math.max(
          15,
          differenceInMinutes(draggedEvent.end, draggedEvent.start)
        );

        const newStart = new Date(targetDate);
        newStart.setHours(
          originalStart.getHours(),
          originalStart.getMinutes(),
          0,
          0
        );
        const newEnd = addMinutes(newStart, durationMinutes);

        handleEventCommit({
          ...draggedEvent,
          start: newStart,
          end: newEnd,
          action: 'move',
        });
        return;
      }

      // Fallback para containers com timestamp direto
      if (overData?.timestamp) {
        const dropTimestamp = overData.timestamp;
        const newStart = new Date(dropTimestamp);
        const durationMinutes = differenceInMinutes(
          draggedEvent.end,
          draggedEvent.start
        );
        const newEnd = addMinutes(newStart, durationMinutes);

        handleEventCommit({
          ...draggedEvent,
          start: newStart,
          end: newEnd,
          action: 'move',
        });
      }
    },
    [handleEventCommit]
  );

  const handleDragCancel = useCallback(() => {
    setActiveEvent(null);
    setActiveDragWidth(null);
    setDragOverSlot(null);
  }, []);

  return {
    calendarEvents,
    activeEvent,
    isDragging: Boolean(activeEvent),
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
  };
}

export default useCalendarDnd;
