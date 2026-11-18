import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useDeleteEvent,
  useEditEvent,
  useGetEvents,
} from '@/features/events/api/hooks';
import EventDropdownMenu from '@/features/events/components/event-dropdown-menu';

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: () => ({
    isSyncEnabled: false,
    isGoogleConnected: false,
  }),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useGetEventTags: () => ({ data: [] }),
  useCreateEventTag: () => ({ mutateAsync: vi.fn() }),
  useDeleteEventTag: () => ({ mutate: vi.fn() }),
  useCreateEvent: vi.fn(),
  useEditEvent: vi.fn(),
  useDeleteEvent: vi.fn(),
  useGetEvents: vi.fn(),
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}));

describe('EventDropdownMenu', () => {
  const mockDeleteMutateAsync = vi.fn();
  const mockEditMutateAsync = vi.fn();

  const mockEvent = {
    id: 'b6f284ea-3617-48f8-8bb3-4700d6aa0967',
    name: 'Aniversário da Maria',
    description: 'Festa de aniversário',
    startDate: '2026-10-20T19:00:00.000Z',
    endDate: '2026-10-20T23:00:00.000Z',
    allDay: false,
    startTime: '19:00',
    endTime: '23:00',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useDeleteEvent.mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    });
    useEditEvent.mockReturnValue({
      mutateAsync: mockEditMutateAsync,
      isPending: false,
    });
    useGetEvents.mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    });
  });

  const renderDropdown = (props = {}) => {
    return render(
      <MemoryRouter initialEntries={['/events']}>
        <Routes>
          <Route
            path="/events"
            element={
              <EventDropdownMenu event={mockEvent} {...props}>
                <button type="button" data-testid="event-trigger">
                  {mockEvent.name}
                </button>
              </EventDropdownMenu>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <div data-testid="event-detail-page">Página de Detalhes</div>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders trigger button and opens menu with 2 items on click', async () => {
    const user = userEvent.setup();
    renderDropdown();

    const trigger = screen.getByTestId('event-trigger');
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(
      await screen.findByRole('menuitem', {
        name: /abrir evento/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /editar evento/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /adicionar transação/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /excluir evento/i })
    ).not.toBeInTheDocument();
  });

  it('navigates to /events/:eventId when clicking "Abrir evento"', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByTestId('event-trigger'));
    const item = await screen.findByRole('menuitem', {
      name: /abrir evento/i,
    });
    await user.click(item);

    await waitFor(() => {
      expect(screen.getByTestId('event-detail-page')).toBeInTheDocument();
    });
  });

  it('opens EditEventSheet when clicking "Editar evento"', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByTestId('event-trigger'));
    const item = await screen.findByRole('menuitem', {
      name: /editar evento/i,
    });
    await user.click(item);

    await waitFor(() => {
      expect(screen.getByText('Editar Evento')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockEvent.name)).toBeInTheDocument();
    });
  });

  it('does not open menu when disabled is true (e.g. during dragging or resizing)', async () => {
    const user = userEvent.setup();
    renderDropdown({ disabled: true });

    await user.click(screen.getByTestId('event-trigger'));

    expect(
      screen.queryByRole('menuitem', { name: /abrir evento/i })
    ).not.toBeInTheDocument();
  });

  it('does not open menu when a drag pointer movement is detected', () => {
    renderDropdown();

    const trigger = screen.getByTestId('event-trigger');
    fireEvent.pointerDown(trigger, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(trigger, { clientX: 120, clientY: 150 });
    fireEvent.click(trigger);

    expect(
      screen.queryByRole('menuitem', { name: /abrir evento/i })
    ).not.toBeInTheDocument();
  });
});
