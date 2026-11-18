import { act, renderHook } from '@testing-library/react';
import { differenceInCalendarDays } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';

import { WeekCellsHeight } from '@/features/events/constants';
import { getSpanningEventsForDay } from '@/features/events/helpers/calendar-layout';
import { useCalendarDnd } from '@/features/events/hooks/use-calendar-dnd';

describe('useCalendarDnd (#158)', () => {
  it('moves a single-day All-Day Event in Month view preserving allDay: true and 00:00:00–23:59:59 civil bounds', () => {
    const originalEvent = {
      id: 'ev-allday-1',
      title: 'Feriado Nacional',
      start: new Date(2026, 10, 10, 0, 0, 0),
      end: new Date(2026, 10, 10, 23, 59, 59),
      allDay: true,
    };
    const events = [originalEvent];
    const onEventUpdate = vi.fn();

    const { result } = renderHook(() =>
      useCalendarDnd({
        events,
        onEventUpdate,
      })
    );

    const targetDay = new Date(2026, 10, 18, 0, 0, 0);

    act(() => {
      result.current.handleDragEnd({
        active: {
          data: { current: { event: originalEvent } },
          rect: { current: {} },
        },
        over: {
          data: {
            current: {
              type: 'month-day',
              dayTimestamp: targetDay.getTime(),
            },
          },
          rect: { top: 0 },
        },
      });
    });

    expect(onEventUpdate).toHaveBeenCalledTimes(1);
    const updated = onEventUpdate.mock.calls[0][0];
    expect(updated.allDay).toBe(true);
    expect(updated.action).toBe('move');
    expect(updated.start).toEqual(new Date(2026, 10, 18, 0, 0, 0, 0));
    expect(updated.end).toEqual(new Date(2026, 10, 18, 23, 59, 59, 0));

    expect(result.current.calendarEvents[0]).toMatchObject({
      id: 'ev-allday-1',
      allDay: true,
      start: new Date(2026, 10, 18, 0, 0, 0, 0),
      end: new Date(2026, 10, 18, 23, 59, 59, 0),
    });
    expect(
      getSpanningEventsForDay(
        result.current.calendarEvents,
        new Date(2026, 10, 19)
      )
    ).toHaveLength(0);
  });

  it('moves a multi-day All-Day Event in Month view preserving exact civil day span without spilling onto the next day', () => {
    const originalEvent = {
      id: 'ev-allday-multi',
      title: 'Festival de 3 Dias',
      start: new Date(2026, 2, 1, 0, 0, 0),
      end: new Date(2026, 2, 3, 23, 59, 59),
      allDay: true,
    };
    const events = [originalEvent];
    const onEventUpdate = vi.fn();

    const { result } = renderHook(() =>
      useCalendarDnd({
        events,
        onEventUpdate,
      })
    );

    // Target spans across typical March DST transition dates (e.g., Mar 7–9 in US timezones)
    const targetDay = new Date(2026, 2, 7, 12, 30, 0);

    act(() => {
      result.current.handleDragEnd({
        active: {
          data: { current: { event: originalEvent } },
          rect: { current: {} },
        },
        over: {
          data: {
            current: {
              type: 'month-day',
              dayTimestamp: targetDay.getTime(),
            },
          },
          rect: { top: 0 },
        },
      });
    });

    const updated = onEventUpdate.mock.calls[0][0];
    expect(updated.allDay).toBe(true);
    expect(updated.start).toEqual(new Date(2026, 2, 7, 0, 0, 0, 0));
    expect(updated.end).toEqual(new Date(2026, 2, 9, 23, 59, 59, 0));
    expect(differenceInCalendarDays(updated.end, updated.start)).toBe(2);

    // Optimistic calendarEvents spans Mar 7, 8, 9 — not Mar 10
    expect(
      getSpanningEventsForDay(
        result.current.calendarEvents,
        new Date(2026, 2, 8)
      )
    ).toHaveLength(1);
    expect(
      getSpanningEventsForDay(
        result.current.calendarEvents,
        new Date(2026, 2, 9)
      )
    ).toHaveLength(1);
    expect(
      getSpanningEventsForDay(
        result.current.calendarEvents,
        new Date(2026, 2, 10)
      )
    ).toHaveLength(0);
  });

  it('moves a Timed Event in Month view preserving local hours, minute duration, and allDay: false (including 00:00–23:59)', () => {
    const timedEvent = {
      id: 'ev-timed-1',
      title: 'Plantão',
      start: new Date(2026, 10, 10, 14, 30, 0),
      end: new Date(2026, 10, 10, 16, 45, 0),
      allDay: false,
    };
    const fullDayTimedEvent = {
      id: 'ev-timed-0023',
      title: 'Operação 24h',
      start: new Date(2026, 10, 10, 0, 0, 0),
      end: new Date(2026, 10, 10, 23, 59, 0),
      allDay: false,
    };
    const events = [timedEvent, fullDayTimedEvent];
    const onEventUpdate = vi.fn();

    const { result } = renderHook(() =>
      useCalendarDnd({
        events,
        onEventUpdate,
      })
    );

    const targetDay = new Date(2026, 10, 21, 0, 0, 0);

    act(() => {
      result.current.handleDragEnd({
        active: {
          data: { current: { event: timedEvent } },
          rect: { current: {} },
        },
        over: {
          data: {
            current: {
              type: 'month-day',
              dayTimestamp: targetDay.getTime(),
            },
          },
          rect: { top: 0 },
        },
      });
    });

    const updatedTimed = onEventUpdate.mock.calls[0][0];
    expect(updatedTimed.allDay).toBe(false);
    expect(updatedTimed.start).toEqual(new Date(2026, 10, 21, 14, 30, 0, 0));
    expect(updatedTimed.end).toEqual(new Date(2026, 10, 21, 16, 45, 0, 0));

    act(() => {
      result.current.handleDragEnd({
        active: {
          data: { current: { event: fullDayTimedEvent } },
          rect: { current: {} },
        },
        over: {
          data: {
            current: {
              type: 'month-day',
              dayTimestamp: targetDay.getTime(),
            },
          },
          rect: { top: 0 },
        },
      });
    });

    const updatedFullDayTimed = onEventUpdate.mock.calls[1][0];
    expect(updatedFullDayTimed.allDay).toBe(false);
    expect(updatedFullDayTimed.start).toEqual(
      new Date(2026, 10, 21, 0, 0, 0, 0)
    );
    expect(updatedFullDayTimed.end).toEqual(
      new Date(2026, 10, 21, 23, 59, 0, 0)
    );
  });

  it('moves a Timed Event to a day-column in Week/Day view preserving allDay: false', () => {
    const timedEvent = {
      id: 'ev-timed-week',
      title: 'Reunião',
      start: new Date(2026, 10, 10, 9, 0, 0),
      end: new Date(2026, 10, 10, 10, 30, 0),
      allDay: false,
    };
    const events = [timedEvent];
    const onEventUpdate = vi.fn();

    const { result } = renderHook(() =>
      useCalendarDnd({
        events,
        onEventUpdate,
      })
    );

    const targetDay = new Date(2026, 10, 12, 0, 0, 0);
    // 14:00 = 14 hours * WeekCellsHeight
    const deltaY = 14 * WeekCellsHeight;

    act(() => {
      result.current.handleDragEnd({
        active: {
          data: { current: { event: timedEvent } },
          rect: { current: { translated: { top: 100 + deltaY } } },
        },
        over: {
          data: {
            current: {
              type: 'day-column',
              dayTimestamp: targetDay.getTime(),
            },
          },
          rect: { top: 100 },
        },
      });
    });

    const updated = onEventUpdate.mock.calls[0][0];
    expect(updated.allDay).toBe(false);
    expect(updated.action).toBe('move');
    expect(updated.start).toEqual(new Date(2026, 10, 12, 14, 0, 0, 0));
    expect(updated.end).toEqual(new Date(2026, 10, 12, 15, 30, 0, 0));
  });
});
