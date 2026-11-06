import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useDeleteTransaction } from '@/features/finances/api/hooks';
import DeleteTransactionButton from '@/features/finances/components/delete-transaction-button';

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/features/finances/api/hooks', () => ({
  useDeleteTransaction: vi.fn(),
}));

const mockTransaction = {
  id: 'tx-456',
  name: 'Supermercado Mensal',
  amount: 850.5,
  date: '2026-11-01T12:00:00.000Z',
  type: 'EXPENSE',
};

const renderWithClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('DeleteTransactionButton', () => {
  const mockDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReset();
    useDeleteTransaction.mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
    });
  });

  it('renders default trigger button with "Excluir" text and accessible label', () => {
    renderWithClient(<DeleteTransactionButton transaction={mockTransaction} />);

    const button = screen.getByRole('button', { name: /excluir transação/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Excluir');
  });

  it('supports custom trigger via render prop for backward compatibility', async () => {
    const user = userEvent.setup();

    renderWithClient(
      <DeleteTransactionButton
        transaction={mockTransaction}
        render={<button type="button">Remover Item</button>}
      />
    );

    const customButton = screen.getByRole('button', { name: /remover item/i });
    expect(customButton).toBeInTheDocument();

    await user.click(customButton);

    expect(
      await screen.findByRole('heading', { name: /excluir transação\?/i })
    ).toBeInTheDocument();
  });

  it('opens confirmation dialog on click and displays formatted description', async () => {
    const user = userEvent.setup();

    renderWithClient(<DeleteTransactionButton transaction={mockTransaction} />);

    await user.click(
      screen.getByRole('button', { name: /excluir transação/i })
    );

    expect(
      await screen.findByRole('heading', { name: /excluir transação\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Você está prestes a excluir a transação "Supermercado Mensal". Esta ação não poderá ser desfeita.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^excluir transação$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^cancelar$/i })
    ).toBeInTheDocument();
  });

  it('falls back to default description when transaction.name is absent', async () => {
    const user = userEvent.setup();

    renderWithClient(
      <DeleteTransactionButton transaction={{ id: 'tx-unknown' }} />
    );

    await user.click(
      screen.getByRole('button', { name: /excluir transação/i })
    );

    expect(
      await screen.findByRole('heading', { name: /excluir transação\?/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Esta ação não poderá ser desfeita.')
    ).toBeInTheDocument();
  });

  it('calls deleteTransaction and triggers success toast and onSuccess callback on confirm', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockDelete.mockResolvedValueOnce({ success: true });

    renderWithClient(
      <DeleteTransactionButton
        transaction={mockTransaction}
        onSuccess={onSuccess}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /excluir transação/i })
    );

    const confirmButton = await screen.findByRole('button', {
      name: /^excluir transação$/i,
    });
    await user.click(confirmButton);

    expect(mockDelete).toHaveBeenCalledWith({ id: 'tx-456' });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      title: 'Transação excluída com sucesso!',
    });
  });

  it('triggers error toast when deleteTransaction fails', async () => {
    const user = userEvent.setup();
    mockDelete.mockRejectedValueOnce(new Error('Network error'));

    renderWithClient(<DeleteTransactionButton transaction={mockTransaction} />);

    await user.click(
      screen.getByRole('button', { name: /excluir transação/i })
    );

    const confirmButton = await screen.findByRole('button', {
      name: /^excluir transação$/i,
    });
    await user.click(confirmButton);

    expect(mockDelete).toHaveBeenCalledWith({ id: 'tx-456' });

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith({
        type: 'error',
        title: 'Não foi possível excluir a transação.',
        description: 'Tente novamente mais tarde.',
      });
    });
  });

  it('closes dialog when cancel button is clicked without deleting', async () => {
    const user = userEvent.setup();

    renderWithClient(<DeleteTransactionButton transaction={mockTransaction} />);

    await user.click(
      screen.getByRole('button', { name: /excluir transação/i })
    );

    const cancelButton = await screen.findByRole('button', {
      name: /^cancelar$/i,
    });
    await user.click(cancelButton);

    expect(mockDelete).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: /excluir transação\?/i })
      ).not.toBeInTheDocument();
    });
  });

  it('disables action buttons when isPending is true', () => {
    useDeleteTransaction.mockReturnValue({
      mutateAsync: mockDelete,
      isPending: true,
    });

    renderWithClient(
      <DeleteTransactionButton transaction={mockTransaction} open={true} />
    );

    expect(
      screen.getByRole('button', { name: /^excluir transação$/i })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /^cancelar$/i })).toBeDisabled();
  });
});
