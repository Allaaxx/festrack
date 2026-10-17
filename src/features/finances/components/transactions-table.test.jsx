import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetTransactions } from '@/features/finances/api/hooks';
import TransactionsTable from '@/features/finances/components/transactions-table';

vi.mock('@/features/finances/api/hooks', () => ({
  useGetTransactions: vi.fn(),
  useCreateTransaction: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useEditTransaction: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteTransaction: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useGetEvents: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(() => ({
    user: { id: 'usr-1', name: 'Test User' },
    isInitializing: false,
  })),
}));

const mockTransactions = [
  {
    id: 'tx-1',
    name: 'Salário Mensal',
    type: 'EARNING',
    amount: 5000,
    date: '2026-10-01T12:00:00.000Z',
  },
  {
    id: 'tx-2',
    name: 'Supermercado Central',
    type: 'EXPENSE',
    amount: 650.5,
    date: '2026-10-05T12:00:00.000Z',
  },
  {
    id: 'tx-3',
    name: 'Tesouro Direto IPCA',
    type: 'INVESTMENT',
    amount: 1000,
    date: '2026-10-10T12:00:00.000Z',
  },
];

const renderComponent = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TransactionsTable {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('TransactionsTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton when fetching transactions', () => {
    useGetTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    renderComponent();

    expect(screen.getByTestId('transactions-loading')).toBeInTheDocument();
  });

  it('renders error state and triggers retry upon clicking retry button', () => {
    const mockRefetch = vi.fn();
    useGetTransactions.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    renderComponent();

    expect(screen.getByTestId('transactions-error')).toBeInTheDocument();
    expect(
      screen.getByText('Não foi possível carregar as transações.')
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /tentar novamente/i });
    fireEvent.click(retryBtn);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when transaction list is empty', () => {
    useGetTransactions.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderComponent();

    expect(screen.getByTestId('transactions-empty')).toBeInTheDocument();
    expect(
      screen.getByText('Nenhuma transação encontrada')
    ).toBeInTheDocument();
  });

  it('renders table rows with formatted titles, types, amounts, and dates', () => {
    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
    });

    renderComponent();

    expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
    expect(screen.getByText('Supermercado Central')).toBeInTheDocument();
    expect(screen.getByText('Tesouro Direto IPCA')).toBeInTheDocument();

    expect(screen.getByText(/R\$\s*5\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*650,50/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*1\.000,00/)).toBeInTheDocument();
  });

  it('filters rows by text search input', async () => {
    const user = userEvent.setup();
    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
    });

    renderComponent();

    const searchInput = screen.getByPlaceholderText('Buscar por título...');
    await user.type(searchInput, 'Salário');

    expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
    expect(screen.queryByText('Supermercado Central')).not.toBeInTheDocument();
    expect(screen.queryByText('Tesouro Direto IPCA')).not.toBeInTheDocument();
  });

  it('opens transaction detail drawer when clicking a row', async () => {
    const user = userEvent.setup();
    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
    });

    renderComponent();

    const row = screen.getByText('Salário Mensal').closest('tr');
    await user.click(row);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Detalhes da Transação')).toBeInTheDocument();
    });
  });

  it('paginates transaction records with page controls', () => {
    const manyTransactions = Array.from({ length: 25 }).map((_, index) => ({
      id: `tx-${index}`,
      name: `Transação ${index + 1}`,
      type: 'EXPENSE',
      amount: 100 * (index + 1),
      date: '2026-10-01T12:00:00.000Z',
    }));

    useGetTransactions.mockReturnValue({
      data: manyTransactions,
      isLoading: false,
      isError: false,
    });

    renderComponent();

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByText('Transação 1')).toBeInTheDocument();
    expect(screen.getByText('Transação 10')).toBeInTheDocument();
    expect(screen.queryByText('Transação 11')).not.toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: /próxima página/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByText('Transação 11')).toBeInTheDocument();
  });
});
