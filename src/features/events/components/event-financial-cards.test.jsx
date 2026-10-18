import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetTransactions } from '@/features/finances/api/hooks';

import EventFinancialCards from './event-financial-cards';

vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container">
        {React.isValidElement(children)
          ? React.cloneElement(children, { width: 320, height: 120 })
          : children}
      </div>
    ),
  };
});

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

  it('renders all four financial KPI cards and Balanço do Evento with zero values and 0% shares when no transactions exist', () => {
    useGetTransactions.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderWithClient(<EventFinancialCards eventId="ev-123" />);

    expect(screen.getByTestId('event-financial-cards')).toBeInTheDocument();
    expect(screen.getByText('Balanço do Evento')).toBeInTheDocument();
    expect(screen.getByText('Total de Receitas')).toBeInTheDocument();
    expect(screen.getByText('Total de Despesas')).toBeInTheDocument();
    expect(screen.getByText('Total de Investimentos')).toBeInTheDocument();
    expect(screen.getByText('Saldo Líquido')).toBeInTheDocument();
    expect(screen.getByText('Total de Entradas')).toBeInTheDocument();
    expect(screen.getByText('Total de Saídas')).toBeInTheDocument();

    const zeroAmounts = screen.getAllByText(/R\$\s*0,00/);
    expect(zeroAmounts.length).toBeGreaterThanOrEqual(4);

    expect(screen.getByTestId('kpi-earnings')).toHaveTextContent('0%');
    expect(screen.getByTestId('kpi-expenses')).toHaveTextContent('0%');
    expect(screen.getByTestId('kpi-investments')).toHaveTextContent('0%');
  });

  it('calculates and formats four KPI cards, percentage shares, Balanço do Evento, and area charts accurately based on transactions', () => {
    const mockTransactions = [
      {
        id: '1',
        type: 'EARNING',
        amount: 3000,
        date: '2026-12-01T10:00:00.000Z',
      },
      {
        id: '2',
        type: 'EARNING',
        amount: 500,
        date: '2026-12-03T10:00:00.000Z',
      },
      {
        id: '3',
        type: 'EXPENSE',
        amount: 1200,
        date: '2026-12-02T10:00:00.000Z',
      },
      {
        id: '4',
        type: 'EXPENSE',
        amount: 300,
        date: '2026-12-04T10:00:00.000Z',
      },
      {
        id: '5',
        type: 'INVESTMENT',
        amount: 800,
        date: '2026-12-05T10:00:00.000Z',
      },
    ];

    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    renderWithClient(<EventFinancialCards eventId="ev-123" />);

    // Total de Receitas: 3500 (60% of 5800)
    // Total de Despesas: 1500 (26% of 5800)
    // Total de Investimentos: 800 (14% of 5800)
    // Saldo Líquido: 3500 - (1500 + 800) = 1200
    const earningsCard = screen.getByTestId('kpi-earnings');
    expect(earningsCard).toHaveTextContent('Total de Receitas');
    expect(earningsCard).toHaveTextContent(/R\$\s*3\.500,00/);
    expect(earningsCard).toHaveTextContent('60%');
    expect(earningsCard).toHaveTextContent('do volume do evento');
    expect(
      earningsCard.querySelector('[data-slot="chart"]')
    ).toBeInTheDocument();

    const expensesCard = screen.getByTestId('kpi-expenses');
    expect(expensesCard).toHaveTextContent('Total de Despesas');
    expect(expensesCard).toHaveTextContent(/R\$\s*1\.500,00/);
    expect(expensesCard).toHaveTextContent('26%');
    expect(expensesCard).toHaveTextContent('do volume do evento');
    expect(
      expensesCard.querySelector('[data-slot="chart"]')
    ).toBeInTheDocument();

    const investmentsCard = screen.getByTestId('kpi-investments');
    expect(investmentsCard).toHaveTextContent('Total de Investimentos');
    expect(investmentsCard).toHaveTextContent(/R\$\s*800,00/);
    expect(investmentsCard).toHaveTextContent('14%');
    expect(investmentsCard).toHaveTextContent('do volume do evento');
    expect(
      investmentsCard.querySelector('[data-slot="chart"]')
    ).toBeInTheDocument();

    const balanceOverviewCard = screen.getByTestId(
      'event-balance-overview-card'
    );
    expect(balanceOverviewCard).toHaveTextContent('Balanço do Evento');
    expect(balanceOverviewCard).toHaveTextContent('Total de Entradas');
    expect(balanceOverviewCard).toHaveTextContent(/R\$\s*3\.500,00/);
    expect(balanceOverviewCard).toHaveTextContent('Total de Saídas');
    expect(balanceOverviewCard).toHaveTextContent(/R\$\s*2\.300,00/);

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
    expect(within(earningsCard).getByText('100%')).toBeInTheDocument();
  });
});

