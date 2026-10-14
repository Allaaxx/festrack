import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MonthView } from '@/features/events/components/month-view';
import { mapEventToCalendarItem } from '@/features/events/helpers/event';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: () => ({
    isSyncEnabled: false,
    isGoogleConnected: false,
  }),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEditEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useGetEvents: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/features/transactions/api/hooks', () => ({
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe('Bug Repro: EventDropdownMenu item click triggers onEventCreate (New Event popup)', () => {
  const rawEvent = {
    id: 'e1000000-0000-0000-0000-000000000001',
    name: 'Reunião de Planejamento',
    description: 'Discussão de metas',
    startDate: '2026-10-15T10:00:00.000Z',
    endDate: '2026-10-15T11:00:00.000Z',
    allDay: false,
    startTime: '10:00',
    endTime: '11:00',
  };

  const calendarEvent = mapEventToCalendarItem(rawEvent);
  const currentDate = new Date(2026, 9, 15);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT trigger onEventCreate when clicking "Editar evento" in MonthView dropdown', async () => {
    const user = userEvent.setup();
    const onEventCreate = vi.fn();
    const onEventSelect = vi.fn();

    const { container } = render(
      <MemoryRouter>
        <MonthView
          currentDate={currentDate}
          events={[calendarEvent]}
          onEventSelect={onEventSelect}
          onEventCreate={onEventCreate}
        />
      </MemoryRouter>
    );

    const eventButton = container.querySelector('button[data-calendar-event]');
    await user.click(eventButton);

    const editMenuItem = await screen.findByRole('menuitem', {
      name: /editar evento/i,
    });
    await user.click(editMenuItem);

    expect(onEventCreate).not.toHaveBeenCalled();
  });

  it('does NOT trigger onEventCreate when interacting with and closing AddTransaction modal from dropdown', async () => {
    const user = userEvent.setup();
    const onEventCreate = vi.fn();
    const onEventSelect = vi.fn();

    const { container } = render(
      <MemoryRouter>
        <MonthView
          currentDate={currentDate}
          events={[calendarEvent]}
          onEventSelect={onEventSelect}
          onEventCreate={onEventCreate}
        />
      </MemoryRouter>
    );

    const eventButton = container.querySelector('button[data-calendar-event]');
    await user.click(eventButton);

    const addTxMenuItem = await screen.findByRole('menuitem', {
      name: /adicionar transação/i,
    });
    await user.click(addTxMenuItem);

    // Modal is open
    expect(
      await screen.findByRole('heading', { name: /adicionar transação/i })
    ).toBeInTheDocument();

    // Click cancel button inside modal
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    // Verify onEventCreate was NEVER called during open, interaction, or close
    expect(onEventCreate).not.toHaveBeenCalled();
  });
});
