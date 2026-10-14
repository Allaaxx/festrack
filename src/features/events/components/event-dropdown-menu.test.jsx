import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useDeleteEvent,
  useEditEvent,
  useGetEvents,
} from '@/features/events/api/hooks';
import EventDropdownMenu from '@/features/events/components/event-dropdown-menu';
import { useCreateTransaction } from '@/features/transactions/api/hooks';

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
  useCreateEvent: vi.fn(),
  useEditEvent: vi.fn(),
  useDeleteEvent: vi.fn(),
  useGetEvents: vi.fn(),
}));

vi.mock('@/features/transactions/api/hooks', () => ({
  useCreateTransaction: vi.fn(),
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}));

describe('EventDropdownMenu', () => {
  const mockDeleteMutateAsync = vi.fn();
  const mockEditMutateAsync = vi.fn();
  const mockCreateTransactionMutateAsync = vi.fn();

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
    useCreateTransaction.mockReturnValue({
      mutateAsync: mockCreateTransactionMutateAsync,
      isPending: false,
    });
  });

  const renderDropdown = (props = {}) => {
    return render(
      <MemoryRouter initialEntries={['/event']}>
        <Routes>
          <Route
            path="/event"
            element={
              <EventDropdownMenu event={mockEvent} {...props}>
                <button type="button" data-testid="event-trigger">
                  {mockEvent.name}
                </button>
              </EventDropdownMenu>
            }
          />
          <Route
            path="/event/:eventId"
            element={<div data-testid="event-detail-page">Página de Detalhes</div>}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders trigger button and opens menu with all 4 items and separator on click', async () => {
    const user = userEvent.setup();
    renderDropdown();

    const trigger = screen.getByTestId('event-trigger');
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(
      await screen.findByRole('menuitem', { name: /ver detalhes e transações/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /editar evento/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /adicionar transação/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /excluir evento/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('navigates to /event/:eventId when clicking "Ver detalhes e transações"', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByTestId('event-trigger'));
    const item = await screen.findByRole('menuitem', {
      name: /ver detalhes e transações/i,
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
    const item = await screen.findByRole('menuitem', { name: /editar evento/i });
    await user.click(item);

    await waitFor(() => {
      expect(screen.getByText('Editar Evento')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockEvent.name)).toBeInTheDocument();
    });
  });

  it('opens transaction creation modal with eventId pre-selected when clicking "Adicionar transação"', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByTestId('event-trigger'));
    const item = await screen.findByRole('menuitem', {
      name: /adicionar transação/i,
    });
    await user.click(item);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText('Adicionar Transação')).toBeInTheDocument();
      // Should show the pre-selected event in the combobox button and be disabled/locked
      const combobox = within(dialog).getByRole('combobox');
      expect(combobox).toHaveTextContent(mockEvent.name);
      expect(combobox).toBeDisabled();
    });
  });

  it('opens delete confirmation dialog and deletes event on confirm when clicking "Excluir evento"', async () => {
    const user = userEvent.setup();
    mockDeleteMutateAsync.mockResolvedValueOnce({ id: mockEvent.id });
    renderDropdown();

    await user.click(screen.getByTestId('event-trigger'));
    const item = await screen.findByRole('menuitem', {
      name: /excluir evento/i,
    });
    await user.click(item);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Excluir evento?')).toBeInTheDocument();
      expect(
        within(dialog).getByText(new RegExp(mockEvent.name, 'i'))
      ).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', {
      name: /^excluir evento$/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: mockEvent.id });
    });
  });

  it('does not open menu when disabled is true (e.g. during dragging or resizing)', async () => {
    const user = userEvent.setup();
    renderDropdown({ disabled: true });

    await user.click(screen.getByTestId('event-trigger'));

    expect(
      screen.queryByRole('menuitem', { name: /ver detalhes e transações/i })
    ).not.toBeInTheDocument();
  });

  it('does not open menu when a drag pointer movement is detected', () => {
    renderDropdown();

    const trigger = screen.getByTestId('event-trigger');
    fireEvent.pointerDown(trigger, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(trigger, { clientX: 120, clientY: 150 });
    fireEvent.click(trigger);

    expect(
      screen.queryByRole('menuitem', { name: /ver detalhes e transações/i })
    ).not.toBeInTheDocument();
  });
});
