import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { WeekCellsHeight } from '@/features/events/constants';
import { useEventResizable } from '@/features/events/hooks/use-event-resizable';

describe('useEventResizable (#158)', () => {
  const createPointerEvent = (clientY) => ({
    clientY,
    pointerId: 1,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(),
    currentTarget: {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    },
  });

  it('resizes bottom edge of a Timed Event and preserves allDay: false with action: resize', () => {
    const timedEvent = {
      id: 'ev-timed-resize-1',
      title: 'Workshop',
      start: new Date(2026, 10, 20, 10, 0, 0),
      end: new Date(2026, 10, 20, 11, 0, 0),
      allDay: false,
    };
    const onEventResize = vi.fn();
    const onEventResizeEnd = vi.fn();

    const { result } = renderHook(() =>
      useEventResizable({
        event: timedEvent,
        onEventResize,
        onEventResizeEnd,
      })
    );

    act(() => {
      result.current.handlePointerDown(createPointerEvent(100), 'bottom');
    });

    // +1 hour = +WeekCellsHeight (72px)
    act(() => {
      result.current.handlePointerMove(
        createPointerEvent(100 + WeekCellsHeight)
      );
    });

    expect(onEventResize).toHaveBeenCalledWith(
      'ev-timed-resize-1',
      new Date(2026, 10, 20, 10, 0, 0),
      new Date(2026, 10, 20, 12, 0, 0)
    );

    act(() => {
      result.current.handlePointerUp(createPointerEvent(100 + WeekCellsHeight));
    });

    expect(onEventResizeEnd).toHaveBeenCalledTimes(1);
    const updated = onEventResizeEnd.mock.calls[0][0];
    expect(updated.allDay).toBe(false);
    expect(updated.action).toBe('resize');
    expect(updated.start).toEqual(new Date(2026, 10, 20, 10, 0, 0));
    expect(updated.end).toEqual(new Date(2026, 10, 20, 12, 0, 0));
  });

  it('resizes top edge of a Timed Event and preserves allDay: false with action: resize', () => {
    const timedEvent = {
      id: 'ev-timed-resize-2',
      title: 'Reunião',
      start: new Date(2026, 10, 20, 10, 0, 0),
      end: new Date(2026, 10, 20, 12, 0, 0),
      allDay: false,
    };
    const onEventResize = vi.fn();
    const onEventResizeEnd = vi.fn();

    const { result } = renderHook(() =>
      useEventResizable({
        event: timedEvent,
        onEventResize,
        onEventResizeEnd,
      })
    );

    act(() => {
      result.current.handlePointerDown(createPointerEvent(200), 'top');
    });

    // -30 minutes = -(WeekCellsHeight / 2)
    act(() => {
      result.current.handlePointerMove(
        createPointerEvent(200 - WeekCellsHeight / 2)
      );
    });

    act(() => {
      result.current.handlePointerUp(
        createPointerEvent(200 - WeekCellsHeight / 2)
      );
    });

    const updated = onEventResizeEnd.mock.calls[0][0];
    expect(updated.allDay).toBe(false);
    expect(updated.action).toBe('resize');
    expect(updated.start).toEqual(new Date(2026, 10, 20, 9, 30, 0));
    expect(updated.end).toEqual(new Date(2026, 10, 20, 12, 0, 0));
  });
});
