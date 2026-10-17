import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetTransactions } from '@/features/finances/api/hooks';
import FinancePage from '@/pages/finance';

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
];

const renderComponent = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FinancePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('FinancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
    });
  });

  it('renders SectionCards, ChartAreaInteractive, and TransactionsTable cleanly', () => {
    renderComponent();

    // SectionCards assertions
    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 12.450,00')).toBeInTheDocument();
    expect(screen.getByText('Despesas do Mês')).toBeInTheDocument();
    expect(screen.getByText('Saldo Geral')).toBeInTheDocument();

    // ChartAreaInteractive assertions
    expect(screen.getByText('Total de Visitantes')).toBeInTheDocument();
    expect(screen.getByText('Total dos últimos 3 meses')).toBeInTheDocument();

    // TransactionsTable assertions
    expect(
      screen.getByTestId('transactions-table-section')
    ).toBeInTheDocument();
    expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
    expect(screen.getByText('Supermercado Central')).toBeInTheDocument();
  });
});
