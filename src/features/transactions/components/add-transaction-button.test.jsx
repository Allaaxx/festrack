import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetEvents } from '@/features/events/api/hooks';
import { useCreateTransaction } from '@/features/transactions/api/hooks';
import AddTransactionButton from '@/features/transactions/components/add-transaction-button';
import { getDefaultTransactionValues } from '@/features/transactions/forms/hooks';

vi.mock('@/features/events/api/hooks', () => ({
  useGetEvents: vi.fn(),
}));

vi.mock('@/features/transactions/api/hooks', () => ({
  useCreateTransaction: vi.fn(),
  useEditTransaction: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('AddTransactionButton', () => {
  let queryClient;
  const mockCreateTransactionMutateAsync = vi.fn();
  const mockEvents = [
    { id: 'ev-1', name: 'Aniversário' },
    { id: 'ev-2', name: 'Churrasco' },
  ];

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useGetEvents.mockReturnValue({
      data: mockEvents,
      isLoading: false,
    });
    useCreateTransaction.mockReturnValue({
      mutateAsync: mockCreateTransactionMutateAsync,
      isPending: false,
    });
  });

  describe('getDefaultTransactionValues', () => {
    it('returns default transaction values with null eventId when omitted', () => {
      const defaults = getDefaultTransactionValues();
      expect(defaults).toEqual({
        name: '',
        amount: 0,
        date: expect.any(Date),
        type: 'EARNING',
        eventId: null,
      });
    });

    it('returns default transaction values with initialEventId when provided', () => {
      const defaults = getDefaultTransactionValues('ev-1');
      expect(defaults).toEqual({
        name: '',
        amount: 0,
        date: expect.any(Date),
        type: 'EARNING',
        eventId: 'ev-1',
      });
    });
  });

  describe('Event locking behavior', () => {
    it('leaves EventCombobox enabled when initialEventId is not provided', async () => {
      const user = userEvent.setup();
      render(<AddTransactionButton />, { wrapper: createWrapper() });

      await user.click(screen.getByRole('button', { name: /nova transação/i }));

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeEnabled();
      expect(combobox).toHaveTextContent('Selecione um evento');
    });

    it('locks and disables EventCombobox when initialEventId is provided', async () => {
      const user = userEvent.setup();
      render(<AddTransactionButton initialEventId="ev-1" />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /nova transação/i }));

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeDisabled();
      expect(combobox).toHaveTextContent('Aniversário');
    });

    it('resets form with initialEventId preserved when clicking Cancelar', async () => {
      const user = userEvent.setup();
      render(<AddTransactionButton initialEventId="ev-1" />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /nova transação/i }));

      await screen.findByRole('dialog');
      const nameInput = screen.getByLabelText(/nome/i);
      await user.type(nameInput, 'Bolo');
      expect(nameInput).toHaveValue('Bolo');

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(nameInput).toHaveValue('');
        const combobox = screen.getByRole('combobox');
        expect(combobox).toBeDisabled();
        expect(combobox).toHaveTextContent('Aniversário');
      });
    });
  });
});
