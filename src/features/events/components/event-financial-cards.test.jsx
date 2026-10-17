import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetTransactions } from '@/features/finances/api/hooks';

import EventFinancialCards from './event-financial-cards';

vi.mock('@/features/finances/api/hooks', async () => {
  const actual = await vi.importActual('@/features/finances/api/hooks');
  return {
    ...actual,
    useGetTransactions: vi.fn(),
  };
});

const renderWithClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('EventFinancialCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton cards when loading', () => {
    useGetTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithClient(<EventFinancialCards eventId="ev-123" />);

    expect(
      screen.getByTestId('event-financial-cards-skeleton')
    ).toBeInTheDocument();
  });

  it('renders all four financial KPI cards with zero values when no transactions exist', () => {
    useGetTransactions.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderWithClient(<EventFinancialCards eventId="ev-123" />);

    expect(screen.getByTestId('event-financial-cards')).toBeInTheDocument();
    expect(screen.getByText('Total de Receitas')).toBeInTheDocument();
    expect(screen.getByText('Total de Despesas')).toBeInTheDocument();
    expect(screen.getByText('Total de Investimentos')).toBeInTheDocument();
    expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();

    const zeroAmounts = screen.getAllByText(/R\$\s*0,00/);
    expect(zeroAmounts.length).toBe(4);
  });

  it('calculates and formats four KPI cards accurately based on transactions', () => {
    const mockTransactions = [
      { id: '1', type: 'EARNING', amount: 3000 },
      { id: '2', type: 'EARNING', amount: 500 },
      { id: '3', type: 'EXPENSE', amount: 1200 },
      { id: '4', type: 'EXPENSE', amount: 300 },
      { id: '5', type: 'INVESTMENT', amount: 800 },
    ];

    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    renderWithClient(<EventFinancialCards eventId="ev-123" />);

    // Total de Receitas: 3500
    // Total de Despesas: 1500
    // Total de Investimentos: 800
    // Saldo Líquido: 3500 - (1500 + 800) = 1200
    const earningsCard = screen.getByTestId('kpi-earnings');
    expect(earningsCard).toHaveTextContent('Total de Receitas');
    expect(earningsCard).toHaveTextContent(/R\$\s*3\.500,00/);

    const expensesCard = screen.getByTestId('kpi-expenses');
    expect(expensesCard).toHaveTextContent('Total de Despesas');
    expect(expensesCard).toHaveTextContent(/R\$\s*1\.500,00/);

    const investmentsCard = screen.getByTestId('kpi-investments');
    expect(investmentsCard).toHaveTextContent('Total de Investimentos');
    expect(investmentsCard).toHaveTextContent(/R\$\s*800,00/);

    const netBalanceCard = screen.getByTestId('kpi-net-balance');
    expect(netBalanceCard).toHaveTextContent('Saldo Líquido');
    expect(netBalanceCard).toHaveTextContent(/R\$\s*1\.200,00/);
  });

  it('calculates negative net balance when expenses and investments exceed earnings', () => {
    const mockTransactions = [
      { id: '1', type: 'EARNING', amount: 200 },
      { id: '2', type: 'EXPENSE', amount: 600 },
      { id: '3', type: 'INVESTMENT', amount: 100 },
    ];

    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    renderWithClient(<EventFinancialCards eventId="ev-123" />);

    // 200 - (600 + 100) = -500
    const netBalanceCard = screen.getByTestId('kpi-net-balance');
    expect(netBalanceCard).toHaveTextContent(/-R\$\s*500,00/);
  });

  it('supports passing transactions directly via props', () => {
    const propTransactions = [{ id: '1', type: 'EARNING', amount: 750 }];

    renderWithClient(
      <EventFinancialCards
        eventId="ev-123"
        transactions={propTransactions}
        isLoading={false}
      />
    );

    const earningsCard = screen.getByTestId('kpi-earnings');
    expect(earningsCard).toHaveTextContent(/R\$\s*750,00/);
  });
});
