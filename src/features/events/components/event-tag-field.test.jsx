import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useShopContext } from '@/contexts/shop';
import {
  useCreateEvent,
  useCreateEventTag,
  useDeleteEventTag,
  useEditEvent,
  useGetEventTags,
} from '@/features/events/api/hooks';
import CreateEventDialog from '@/features/events/components/create-event-dialog';
import EditEventSheet from '@/features/events/components/edit-event-sheet';
import { useGoogleCalendarSync } from '@/features/events/hooks/use-google-calendar-sync';

vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn() } }));
vi.mock('@/contexts/shop', () => ({ useShopContext: vi.fn() }));
vi.mock('@/features/events/hooks/use-google-calendar-sync', () => ({
  useGoogleCalendarSync: vi.fn(),
}));
vi.mock('@/features/events/api/hooks', () => ({
  useCreateEvent: vi.fn(),
  useEditEvent: vi.fn(),
  useDeleteEvent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useGetEventTags: vi.fn(),
  useCreateEventTag: vi.fn(),
  useDeleteEventTag: vi.fn(),
}));
vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}));

const SERVER_TAGS = [
  { id: 't1', slug: 'trabalho', name: 'Trabalho', color: 'bg-blue-500' },
  { id: 't2', slug: 'lazer', name: 'Lazer', color: 'bg-green-500' },
];

const EXISTING_EVENT = {
  id: '6f1c2a8e-3b4d-4c5e-9f60-7a8b9c0d1e2f',
  name: 'Reunião',
  description: '',
  startDate: '2026-12-10T12:00:00.000Z',
  endDate: '2026-12-10T13:00:00.000Z',
  allDay: false,
  tag: 'trabalho',
};

const openTagPicker = () =>
  fireEvent.click(screen.getByRole('button', { name: /^etiqueta/i }));

describe('Etiqueta opcional nos modais de evento', () => {
  const createEvent = vi.fn();
  const editEvent = vi.fn();
  const createTag = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useShopContext.mockReturnValue({
      role: 'OWNER',
      activeShop: { id: 'shop-1', role: 'OWNER' },
    });
    useGoogleCalendarSync.mockReturnValue({ isSyncEnabled: false });
    useCreateEvent.mockReturnValue({ mutateAsync: createEvent });
    useEditEvent.mockReturnValue({ mutateAsync: editEvent });
    useGetEventTags.mockReturnValue({ data: SERVER_TAGS });
    useCreateEventTag.mockReturnValue({ mutateAsync: createTag });
    useDeleteEventTag.mockReturnValue({ mutate: vi.fn() });
    createEvent.mockResolvedValue({ id: 'ev-1' });
    editEvent.mockResolvedValue({ id: EXISTING_EVENT.id });
  });

  const renderCreate = () => {
    render(
      <CreateEventDialog
        open
        onOpenChange={vi.fn()}
        initialDate={new Date(2026, 11, 1)}
      />
    );
    fireEvent.change(screen.getByLabelText(/nome do evento/i), {
      target: { value: 'Festa' },
    });
  };

  const submitCreate = () =>
    fireEvent.click(screen.getByRole('button', { name: /criar evento/i }));

  describe('CreateEventDialog', () => {
    it('envia tag null quando nenhuma etiqueta é escolhida', async () => {
      renderCreate();
      submitCreate();
      await waitFor(() =>
        expect(createEvent).toHaveBeenCalledWith(
          expect.objectContaining({ tag: null })
        )
      );
    });

    it('envia a etiqueta selecionada no payload', async () => {
      renderCreate();
      openTagPicker();
      fireEvent.click(await screen.findByRole('option', { name: 'Lazer' }));
      submitCreate();
      await waitFor(() =>
        expect(createEvent).toHaveBeenCalledWith(
          expect.objectContaining({ tag: 'lazer' })
        )
      );
    });

    it('seleciona a etiqueta recém-criada', async () => {
      createTag.mockResolvedValue({
        id: 't3',
        slug: 'aniversario',
        name: 'Aniversário',
      });
      renderCreate();
      openTagPicker();
      const input = await screen.findByPlaceholderText(/nova etiqueta/i);
      fireEvent.change(input, { target: { value: 'Aniversário' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(createTag).toHaveBeenCalled());
      submitCreate();
      await waitFor(() =>
        expect(createEvent).toHaveBeenCalledWith(
          expect.objectContaining({ tag: 'aniversario' })
        )
      );
    });

    it('seleção operável por teclado', async () => {
      renderCreate();
      openTagPicker();
      const option = await screen.findByRole('option', { name: 'Trabalho' });
      fireEvent.keyDown(option, { key: 'Enter' });
      submitCreate();
      await waitFor(() =>
        expect(createEvent).toHaveBeenCalledWith(
          expect.objectContaining({ tag: 'trabalho' })
        )
      );
    });
  });

  describe('EditEventSheet', () => {
    const submitEdit = () =>
      fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    it('mantém a etiqueta existente do evento', async () => {
      render(
        <EditEventSheet event={EXISTING_EVENT} open onOpenChange={vi.fn()} />
      );
      submitEdit();
      await waitFor(() =>
        expect(editEvent).toHaveBeenCalledWith(
          expect.objectContaining({ tag: 'trabalho' })
        )
      );
    });

    it('limpa a etiqueta e envia null', async () => {
      render(
        <EditEventSheet event={EXISTING_EVENT} open onOpenChange={vi.fn()} />
      );
      fireEvent.click(screen.getByRole('button', { name: /limpar etiqueta/i }));
      submitEdit();
      await waitFor(() =>
        expect(editEvent).toHaveBeenCalledWith(
          expect.objectContaining({ tag: null })
        )
      );
    });

    it('troca a etiqueta selecionada', async () => {
      render(
        <EditEventSheet event={EXISTING_EVENT} open onOpenChange={vi.fn()} />
      );
      openTagPicker();
      fireEvent.click(await screen.findByRole('option', { name: 'Lazer' }));
      submitEdit();
      await waitFor(() =>
        expect(editEvent).toHaveBeenCalledWith(
          expect.objectContaining({ tag: 'lazer' })
        )
      );
    });
  });
});
