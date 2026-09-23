import { useDraggable } from '@dnd-kit/core';

import { cn } from '@/lib/utils';

import { useEventResizable } from '../hooks/use-event-resizable';
import { EventItem } from './event-item';

function ResizeHandle({
  position,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  title,
}) {
  const isTop = position === 'top';

  return (
    <div
      data-resize-handle={position}
      onPointerDown={(e) => onPointerDown(e, position)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        'group/handle absolute right-0 left-0 z-30 flex h-3 cursor-ns-resize touch-none items-center justify-center opacity-0 transition-opacity group-hover/event-block:opacity-100',
        isTop ? '-top-1.5' : '-bottom-1.5'
      )}
      title={title}
    >
      <div className="bg-foreground/40 group-hover/handle:bg-foreground/80 h-1 w-7 rounded-full shadow-xs transition-colors" />
    </div>
  );
}

export function CalendarEventBlock({
  positionedEvent,
  view,
  onEventSelect,
  onEventResize,
  onEventResizeEnd,
}) {
  const { event, top, height, left, width, zIndex } = positionedEvent;

  const { isResizing, handlePointerDown, handlePointerMove, handlePointerUp } =
    useEventResizable({
      event,
      onEventResize,
      onEventResizeEnd,
    });

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: {
      event,
    },
    disabled: isResizing,
  });

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
      <ResizeHandle
        position="top"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Ajustar início"
      />

      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="h-full w-full cursor-grab select-none active:cursor-grabbing"
      >
        <EventItem event={event} view={view} onClick={handleClick} showTime />
      </div>

      <ResizeHandle
        position="bottom"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Ajustar término"
      />
    </div>
  );
}

export default CalendarEventBlock;
