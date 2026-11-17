import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useEditEvent, useGetEvents } from '@/features/events';
import { useEventCalendarPage } from '@/features/events/hooks/use-event-calendar-page';

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

vi.mock('@/features/events', () => ({
  mapEventToCalendarItem: (ev) => ({
    ...ev,
    title: ev.name,
    start: new Date(ev.startDate),
    end: new Date(ev.endDate),
    allDay: false,
    rawEvent: ev,
  }),
  useEditEvent: vi.fn(),
  useGetEvents: vi.fn(),
}));

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
});
