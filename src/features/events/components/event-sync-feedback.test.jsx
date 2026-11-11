import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import {
  useCreateEvent,
  useDeleteEvent,
  useEditEvent,
} from '@/features/events/api/hooks';
import CreateEventDialog from '@/features/events/components/create-event-dialog';
import DeleteEventButton from '@/features/events/components/delete-event-button';
import EditEventSheet from '@/features/events/components/edit-event-sheet';
import { useGoogleCalendarSync } from '@/features/events/hooks/use-google-calendar-sync';

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: vi.fn(),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useCreateEvent: vi.fn(),
  useEditEvent: vi.fn(),
  useDeleteEvent: vi.fn(),
}));

// Mock react-day-picker and calendar primitives that may render inside dialogs
vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}));

describe('Event Lifecycle Mutations - Google Calendar Sync Feedback', () => {
  const mockCreateMutateAsync = vi.fn();
  const mockEditMutateAsync = vi.fn();
  const mockDeleteMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useCreateEvent.mockReturnValue({
      mutateAsync: mockCreateMutateAsync,
    });
    useEditEvent.mockReturnValue({
      mutateAsync: mockEditMutateAsync,
    });
    useDeleteEvent.mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    });
  });

  describe('CreateEventDialog', () => {
    it('shows warning toast when sync is active but Google Calendar export fails non-blockingly', async () => {
      useGoogleCalendarSync.mockReturnValue({
        isSyncEnabled: true,
      });

      // Backend returns saved event with syncError / no googleEventId
      mockCreateMutateAsync.mockResolvedValueOnce({
        id: 'ev-1',
        name: 'Festa',
        googleEventId: null,
        syncError: true,
      });

      render(
        <CreateEventDialog
          open={true}
          onOpenChange={vi.fn()}
          initialDate={new Date(2026, 11, 1)}
        />
      );

      // Fill in event name
      const nameInput = screen.getByLabelText(/nome do evento/i);
      fireEvent.change(nameInput, { target: { value: 'Festa' } });

      const saveButton = screen.getByRole('button', { name: /criar evento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalled();
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'warning',
            title: expect.stringMatching(/evento criado com aviso/i),
            description: expect.stringMatching(
              /evento salvo localmente, mas não foi possível sincronizar/i
            ),
          })
        );
      });
    });

    it('shows standard success toast when sync is active and Google Calendar export succeeds', async () => {
      useGoogleCalendarSync.mockReturnValue({
        isSyncEnabled: true,
      });

      mockCreateMutateAsync.mockResolvedValueOnce({
        id: 'ev-2',
        name: 'Casamento',
        googleEventId: 'google-id-123',
        syncError: false,
      });

      render(
        <CreateEventDialog
          open={true}
          onOpenChange={vi.fn()}
          initialDate={new Date(2026, 11, 1)}
        />
      );

      const nameInput = screen.getByLabelText(/nome do evento/i);
      fireEvent.change(nameInput, { target: { value: 'Casamento' } });

      const saveButton = screen.getByRole('button', { name: /criar evento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: expect.stringMatching(/evento criado com sucesso/i),
          })
        );
      });
    });

    it('handles midnight rollover correctly when initialDate is at 23:xx without validation error', async () => {
      useGoogleCalendarSync.mockReturnValue({
        isSyncEnabled: false,
      });

      mockCreateMutateAsync.mockResolvedValueOnce({
        id: 'ev-3',
        name: 'Evento Noturno',
      });

      // initialDate at 23:30 should roll endDate over to next day instead of failing validation
      render(
        <CreateEventDialog
          open={true}
          onOpenChange={vi.fn()}
          initialDate={new Date(2026, 11, 1, 23, 30)}
        />
      );

      const nameInput = screen.getByLabelText(/nome do evento/i);
      fireEvent.change(nameInput, { target: { value: 'Evento Noturno' } });

      const saveButton = screen.getByRole('button', { name: /criar evento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Evento Noturno',
            startTime: '23:30',
            endTime: '00:30',
          })
        );
      });
    });
  });

  describe('EditEventSheet', () => {
    it('shows warning toast when editing an event with sync active and Google Calendar fails non-blockingly', async () => {
      useGoogleCalendarSync.mockReturnValue({
        isSyncEnabled: true,
      });

      const validEventId = '123e4567-e89b-12d3-a456-426614174000';
      mockEditMutateAsync.mockResolvedValueOnce({
        id: validEventId,
        name: 'Festa Alterada',
        googleEventId: 'g-old-id',
        syncError: true,
      });

      const mockEvent = {
        id: validEventId,
        name: 'Festa',
        startDate: '2026-12-01T09:00:00.000Z',
        endDate: '2026-12-01T10:00:00.000Z',
        allDay: false,
      };

      render(
        <EditEventSheet event={mockEvent} open={true} onOpenChange={vi.fn()} />
      );

      const form = document.getElementById('editEvent');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockEditMutateAsync).toHaveBeenCalled();
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'warning',
            title: expect.stringMatching(/evento editado com aviso/i),
            description: expect.stringMatching(
              /alterações salvas localmente, mas não foi possível atualizar no google agenda/i
            ),
          })
        );
      });
    });
  });

  describe('DeleteEventButton', () => {
    it('shows warning toast when event deletion succeeds locally but Google Calendar deletion fails', async () => {
      mockDeleteMutateAsync.mockResolvedValueOnce({
        id: 'ev-1',
        syncError: true,
      });

      render(
        <DeleteEventButton
          event={{ id: 'ev-1', name: 'Evento Teste' }}
          onSuccess={vi.fn()}
        />
      );

      const deleteTrigger = screen.getByRole('button', {
        name: /excluir evento/i,
      });
      fireEvent.click(deleteTrigger);

      // Confirm dialog button
      const confirmButtons = screen.getAllByRole('button', {
        name: /excluir evento/i,
      });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: 'ev-1' });
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'warning',
            title: expect.stringMatching(/evento excluído com aviso/i),
            description: expect.stringMatching(
              /evento excluído no festrack, mas não foi possível remover do google agenda/i
            ),
          })
        );
      });
    });

    it('shows standard success toast when event deletion succeeds without sync error', async () => {
      const onSuccess = vi.fn();
      mockDeleteMutateAsync.mockResolvedValueOnce({
        id: 'ev-1',
        syncError: false,
      });

      render(
        <DeleteEventButton
          event={{ id: 'ev-1', name: 'Evento Teste' }}
          onSuccess={onSuccess}
        />
      );

      const deleteTrigger = screen.getByRole('button', {
        name: /excluir evento/i,
      });
      fireEvent.click(deleteTrigger);

      const confirmButtons = screen.getAllByRole('button', {
        name: /excluir evento/i,
      });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: 'ev-1' });
        expect(onSuccess).toHaveBeenCalled();
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Evento excluído com sucesso!',
          })
        );
      });
    });

    it('shows error toast when event deletion throws an error', async () => {
      mockDeleteMutateAsync.mockRejectedValueOnce(new Error('Network error'));

      render(
        <DeleteEventButton
          event={{ id: 'ev-1', name: 'Evento Teste' }}
          onSuccess={vi.fn()}
        />
      );

      const deleteTrigger = screen.getByRole('button', {
        name: /excluir evento/i,
      });
      fireEvent.click(deleteTrigger);

      const confirmButtons = screen.getAllByRole('button', {
        name: /excluir evento/i,
      });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: 'ev-1' });
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Não foi possível excluir o evento.',
            description: 'Tente novamente mais tarde.',
          })
        );
      });
    });

    it('renders custom trigger and uses fallback description when event name is absent', async () => {
      render(
        <DeleteEventButton
          event={{ id: 'ev-no-name' }}
          trigger={<button>Custom Delete</button>}
        />
      );

      const customTrigger = screen.getByRole('button', {
        name: /custom delete/i,
      });
      fireEvent.click(customTrigger);

      expect(
        screen.getByText('Esta ação não poderá ser desfeita.')
      ).toBeInTheDocument();
    });
  });
});
