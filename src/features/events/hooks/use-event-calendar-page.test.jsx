import { act, renderHook } from '@testing-library/react';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useEditEvent, useGetEvents } from '@/features/events';
import EventService from '@/features/events/api/services';
import { useCalendarDnd } from '@/features/events/hooks/use-calendar-dnd';
import { useEventCalendarPage } from '@/features/events/hooks/use-event-calendar-page';
import protectedApi from '@/lib/axios';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: () => ({
    user: { id: 'usr-1' },
  }),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: () => ({
    activeShop: { id: 'shop-test-1' },
  }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/events', async () => {
  const { mapEventToCalendarItem } = await vi.importActual(
    '@/features/events/helpers/event'
  );
  return {
    mapEventToCalendarItem,
    useEditEvent: vi.fn(),
    useGetEvents: vi.fn(),
  };
});

describe('useEventCalendarPage - Event Update and Google Calendar Sync Feedback (#133)', () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useGetEvents.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useEditEvent.mockReturnValue({
      mutate: mockMutate,
    });
  });

  const renderPageHook = () =>
    renderHook(() => useEventCalendarPage(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

  it('triggers editEventMutation with updated dates when an event is moved in the calendar', () => {
    const { result } = renderPageHook();

    const updatedItem = {
      id: 'ev-1',
      title: 'Reunião com Parceiros',
      start: new Date(2026, 10, 20, 14, 0),
      end: new Date(2026, 10, 20, 15, 0),
      allDay: false,
      action: 'move',
      rawEvent: {
        id: 'ev-1',
        name: 'Reunião com Parceiros',
        startDate: '2026-11-20T10:00:00.000Z',
        endDate: '2026-11-20T11:00:00.000Z',
      },
    };

    act(() => {
      result.current.handlers.handleEventUpdate(updatedItem);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ev-1',
        name: 'Reunião com Parceiros',
        startDate: updatedItem.start,
        endDate: updatedItem.end,
        allDay: false,
      }),
      expect.any(Object)
    );
  });

  it('displays warning toast when event update succeeds locally but Google Calendar sync fails', () => {
    mockMutate.mockImplementation((params, options) => {
      options.onSuccess?.({ syncError: true });
    });

    const { result } = renderPageHook();

    const updatedItem = {
      id: 'ev-2',
      title: 'Workshop',
      start: new Date(2026, 10, 22, 9, 0),
      end: new Date(2026, 10, 22, 11, 0),
      allDay: false,
      action: 'move',
      rawEvent: { id: 'ev-2', name: 'Workshop' },
    };

    act(() => {
      result.current.handlers.handleEventUpdate(updatedItem);
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
        description:
          'Salvo no Festrack, mas não foi possível atualizar no Google Agenda.',
      })
    );
  });

  it('displays success toast when event update and sync succeed', () => {
    mockMutate.mockImplementation((params, options) => {
      options.onSuccess?.({ syncError: false });
    });

    const { result } = renderPageHook();

    const updatedItem = {
      id: 'ev-3',
      title: 'Conferência Anual',
      start: new Date(2026, 10, 25, 10, 0),
      end: new Date(2026, 10, 25, 16, 0),
      allDay: false,
      action: 'resize',
      rawEvent: { id: 'ev-3', name: 'Conferência Anual' },
    };

    act(() => {
      result.current.handlers.handleEventUpdate(updatedItem);
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'Evento "Conferência Anual" redimensionado',
      })
    );
  });

  it('preserves allDay: true for All-Day Events when mapping events and calling handleEventUpdate', () => {
    useGetEvents.mockReturnValue({
      data: [
        {
          id: 'ev-allday-1',
          name: 'Feriado prolongado',
          description: null,
          startDate: '2026-11-10T00:00:00.000Z',
          endDate: '2026-11-12T23:59:59.000Z',
          allDay: true,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { result } = renderPageHook();

    expect(result.current.events).toHaveLength(1);
    const calendarItem = result.current.events[0];
    expect(calendarItem.allDay).toBe(true);
    expect(calendarItem.start).toEqual(new Date(2026, 10, 10, 0, 0, 0));
    expect(calendarItem.end).toEqual(new Date(2026, 10, 12, 23, 59, 59));

    act(() => {
      result.current.handlers.handleEventUpdate({
        ...calendarItem,
        start: new Date(2026, 10, 15, 0, 0, 0),
        end: new Date(2026, 10, 17, 23, 59, 59),
        action: 'move',
      });
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ev-allday-1',
        name: 'Feriado prolongado',
        allDay: true,
        startDate: new Date(2026, 10, 15, 0, 0, 0),
        endDate: new Date(2026, 10, 17, 23, 59, 59),
      }),
      expect.any(Object)
    );
  });

  it('sends all_day: true with UTC civil boundaries via EventService.update after Month view DnD of an All-Day Event', async () => {
    protectedApi.patch.mockResolvedValue({
      data: {
        id: 'ev-allday-2',
        shop_id: 'shop-test-1',
        name: 'Feira Anual',
        description: null,
        start_date: '2026-11-18T00:00:00.000Z',
        end_date: '2026-11-20T23:59:59.000Z',
        all_day: true,
      },
    });

    mockMutate.mockImplementation((input) =>
      EventService.update({ shopId: 'shop-test-1', ...input })
    );

    useGetEvents.mockReturnValue({
      data: [
        {
          id: 'ev-allday-2',
          name: 'Feira Anual',
          description: null,
          startDate: '2026-11-10T00:00:00.000Z',
          endDate: '2026-11-12T23:59:59.000Z',
          allDay: true,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { result: pageResult } = renderPageHook();
    const calendarItem = pageResult.current.events[0];

    const { result: dndResult } = renderHook(() =>
      useCalendarDnd({
        events: pageResult.current.events,
        onEventUpdate: pageResult.current.handlers.handleEventUpdate,
      })
    );

    act(() => {
      dndResult.current.handleDragEnd({
        active: {
          data: { current: { event: calendarItem } },
          rect: { current: {} },
        },
        over: {
          data: {
            current: {
              type: 'month-day',
              dayTimestamp: new Date(2026, 10, 18).getTime(),
            },
          },
          rect: { top: 0 },
        },
      });
    });

    expect(protectedApi.patch).toHaveBeenCalledWith(
      '/shops/shop-test-1/events/ev-allday-2',
      expect.objectContaining({
        name: 'Feira Anual',
        all_day: true,
        start_date: '2026-11-18T00:00:00.000Z',
        end_date: '2026-11-20T23:59:59.000Z',
      })
    );
  });

  it('sends all_day: false with local offset timestamps via EventService.update when moving or resizing a Timed Event', async () => {
    protectedApi.patch.mockResolvedValue({
      data: {
        id: 'ev-timed-2',
        shop_id: 'shop-test-1',
        name: 'Cerimônia',
        description: null,
        start_date: '2026-11-21T14:00:00.000Z',
        end_date: '2026-11-21T16:30:00.000Z',
        all_day: false,
      },
    });

    mockMutate.mockImplementation((input) =>
      EventService.update({ shopId: 'shop-test-1', ...input })
    );

    useGetEvents.mockReturnValue({
      data: [
        {
          id: 'ev-timed-2',
          name: 'Cerimônia',
          description: null,
          startDate: format(
            new Date(2026, 10, 10, 14, 0, 0),
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          ),
          endDate: format(
            new Date(2026, 10, 10, 16, 30, 0),
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          ),
          allDay: false,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { result: pageResult } = renderPageHook();
    const calendarItem = pageResult.current.events[0];

    const { result: dndResult } = renderHook(() =>
      useCalendarDnd({
        events: pageResult.current.events,
        onEventUpdate: pageResult.current.handlers.handleEventUpdate,
      })
    );

    act(() => {
      dndResult.current.handleDragEnd({
        active: {
          data: { current: { event: calendarItem } },
          rect: { current: {} },
        },
        over: {
          data: {
            current: {
              type: 'month-day',
              dayTimestamp: new Date(2026, 10, 21).getTime(),
            },
          },
          rect: { top: 0 },
        },
      });
    });

    expect(protectedApi.patch).toHaveBeenCalledWith(
      '/shops/shop-test-1/events/ev-timed-2',
      expect.objectContaining({
        name: 'Cerimônia',
        all_day: false,
        start_date: format(
          new Date(2026, 10, 21, 14, 0, 0),
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        ),
        end_date: format(
          new Date(2026, 10, 21, 16, 30, 0),
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        ),
      })
    );

    act(() => {
      pageResult.current.handlers.handleEventUpdate({
        ...calendarItem,
        start: new Date(2026, 10, 21, 14, 0, 0),
        end: new Date(2026, 10, 21, 18, 0, 0),
        action: 'resize',
      });
    });

    expect(protectedApi.patch).toHaveBeenLastCalledWith(
      '/shops/shop-test-1/events/ev-timed-2',
      expect.objectContaining({
        name: 'Cerimônia',
        all_day: false,
        start_date: format(
          new Date(2026, 10, 21, 14, 0, 0),
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        ),
        end_date: format(
          new Date(2026, 10, 21, 18, 0, 0),
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        ),
      })
    );
  });
});
