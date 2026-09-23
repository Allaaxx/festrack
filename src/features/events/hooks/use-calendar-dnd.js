import {
  closestCenter,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { addMinutes, differenceInMinutes } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';

/**
 * Hook para orquestrar o drag and drop e manipulação otimista de eventos do calendário com @dnd-kit.
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
    if (event.active.rect.current?.initial) {
      setActiveDragWidth(event.active.rect.current.initial.width);
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

      if (!over || !over.data?.current?.timestamp) {
        return;
      }

      const draggedEvent = active.data?.current?.event;
      if (!draggedEvent) return;

      const dropTimestamp = over.data.current.timestamp;
      const newStart = new Date(dropTimestamp);
      const durationMinutes = differenceInMinutes(
        draggedEvent.end,
        draggedEvent.start
      );
      const newEnd = addMinutes(newStart, durationMinutes);

      const updatedEvent = {
        ...draggedEvent,
        start: newStart,
        end: newEnd,
      };

      handleEventCommit(updatedEvent);
    },
    [handleEventCommit]
  );

  const handleDragCancel = useCallback(() => {
    setActiveEvent(null);
    setActiveDragWidth(null);
  }, []);

  return {
    calendarEvents,
    activeEvent,
    activeDragWidth,
    sensors,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleEventResize,
    handleEventCommit,
  };
}
