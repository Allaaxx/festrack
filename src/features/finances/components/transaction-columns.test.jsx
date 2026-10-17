import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import DeleteTransactionButton from '@/features/finances/components/delete-transaction-button';
import EditTransactionButton from '@/features/finances/components/edit-transaction-button';
import { TransactionActionsCell } from '@/features/finances/components/transaction-columns';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

vi.mock('@/features/events/api/hooks', () => ({
  useGetEvents: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/features/finances/api/hooks', () => ({
  useCreateTransaction: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useEditTransaction: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteTransaction: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

const mockTransaction = {
  id: 'tx-123',
  name: 'Aluguel Escritório',
  amount: 2500,
  date: '2026-10-15T10:00:00.000Z',
  type: 'EXPENSE',
  eventId: null,
};

const renderWithClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('TransactionActionsCell & Modal Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: { id: 'usr-1', firstName: 'Allan', name: 'Allan Rodrigues' },
    });
  });

  it('renders the action trigger button with accessible label', () => {
    renderWithClient(<TransactionActionsCell transaction={mockTransaction} />);

    const trigger = screen.getByRole('button', {
      name: /ações da transação/i,
    });
    expect(trigger).toBeInTheDocument();
  });

  it('opens dropdown menu on trigger click and does NOT bubble click to parent row', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    renderWithClient(
      <table>
        <tbody>
          <tr onClick={handleRowClick}>
            <td>
              <TransactionActionsCell transaction={mockTransaction} />
            </td>
          </tr>
        </tbody>
      </table>
    );

    const trigger = screen.getByRole('button', {
      name: /ações da transação/i,
    });
    await user.click(trigger);

    expect(handleRowClick).not.toHaveBeenCalled();

    expect(
      await screen.findByRole('menuitem', { name: /editar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /excluir/i })
    ).toBeInTheDocument();
  });

  it('opens Edit sheet without triggering row click and allows form interaction', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    renderWithClient(
      <table>
        <tbody>
          <tr onClick={handleRowClick}>
            <td>
              <TransactionActionsCell transaction={mockTransaction} />
            </td>
          </tr>
        </tbody>
      </table>
    );

    const trigger = screen.getByRole('button', {
      name: /ações da transação/i,
    });
    await user.click(trigger);

    const editMenuItem = await screen.findByRole('menuitem', {
      name: /editar/i,
    });
    await user.click(editMenuItem);

    expect(handleRowClick).not.toHaveBeenCalled();

    // Edit sheet should be visible
    expect(
      await screen.findByRole('heading', { name: /editar transação/i })
    ).toBeInTheDocument();

    // Interacting inside the sheet does not bubble to row
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(handleRowClick).not.toHaveBeenCalled();
  });

  it('opens Delete dialog without triggering row click and allows dialog interaction', async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    renderWithClient(
      <table>
        <tbody>
          <tr onClick={handleRowClick}>
            <td>
              <TransactionActionsCell transaction={mockTransaction} />
            </td>
          </tr>
        </tbody>
      </table>
    );

    const trigger = screen.getByRole('button', {
      name: /ações da transação/i,
    });
    await user.click(trigger);

    const deleteMenuItem = await screen.findByRole('menuitem', {
      name: /excluir/i,
    });
    await user.click(deleteMenuItem);

    expect(handleRowClick).not.toHaveBeenCalled();

    // Delete dialog should be visible
    expect(
      await screen.findByRole('heading', {
        name: /deletar "aluguel escritório"/i,
      })
    ).toBeInTheDocument();

    // Interacting inside the dialog does not bubble to row
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(handleRowClick).not.toHaveBeenCalled();
  });

  it('EditTransactionButton supports controlled open, onOpenChange, and custom trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = renderWithClient(
      <EditTransactionButton
        transaction={mockTransaction}
        open={false}
        onOpenChange={onOpenChange}
        trigger={<button>Custom Edit Trigger</button>}
      />
    );

    expect(
      screen.queryByRole('heading', { name: /editar transação/i })
    ).not.toBeInTheDocument();

    const customTrigger = screen.getByRole('button', {
      name: /custom edit trigger/i,
    });
    await user.click(customTrigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    // Controlled open = true
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <EditTransactionButton
          transaction={mockTransaction}
          open={true}
          onOpenChange={onOpenChange}
          trigger={null}
        />
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole('heading', { name: /editar transação/i })
    ).toBeInTheDocument();
  });

  it('DeleteTransactionButton supports controlled open, onOpenChange, and custom trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    const { rerender } = renderWithClient(
      <DeleteTransactionButton
        transaction={mockTransaction}
        open={false}
        onOpenChange={onOpenChange}
        trigger={<button>Custom Delete Trigger</button>}
      />
    );

    expect(
      screen.queryByRole('heading', {
        name: /deletar "aluguel escritório"/i,
      })
    ).not.toBeInTheDocument();

    const customTrigger = screen.getByRole('button', {
      name: /custom delete trigger/i,
    });
    await user.click(customTrigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    // Controlled open = true
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <DeleteTransactionButton
          transaction={mockTransaction}
          open={true}
          onOpenChange={onOpenChange}
          trigger={null}
        />
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole('heading', {
        name: /deletar "aluguel escritório"/i,
      })
    ).toBeInTheDocument();
  });
});
