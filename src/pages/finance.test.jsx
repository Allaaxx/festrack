import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import React, { useEffect } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getStoredFiltersKey,
  LOCAL_STORAGE_FINANCE_FILTERS_KEY,
} from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import {
  BalanceService,
  TransactionService,
} from '@/features/finances/api/services';
import FinancePage from '@/pages/finance';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/events/api/hooks', () => ({
  useGetEvents: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/features/finances/api/services', () => ({
  BalanceService: {
    getBalance: vi.fn(),
  },
  TransactionService: {
    getAll: vi.fn(),
  },
}));

vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => (
      <div data-testid="responsive-container">
        {React.isValidElement(children)
          ? React.cloneElement(children, { width: 500, height: 300 })
          : children}
      </div>
    ),
  };
});

const mockUser = { id: 'usr-1', name: 'Test User' };
const storageKey = getStoredFiltersKey(
  mockUser.id,
  LOCAL_STORAGE_FINANCE_FILTERS_KEY
);

const fixedDate = new Date(2026, 9, 15, 12, 0, 0); // 2026-10-15

const mockBalance = {
  balance: 4349.5,
  earnings: 5000,
  expenses: 650.5,
  investiments: 0,
  earningsPercentage: 12.5,
  expensePercentage: -5.2,
  investmentsPercentage: 0,
};

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

let lastLocation = { search: '', pathname: '' };

const LocationTracker = () => {
  const location = useLocation();
  useEffect(() => {
    lastLocation = location;
  }, [location]);
  return null;
};

const renderComponent = (initialEntries = ['/finances']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationTracker />
        <FinancePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('FinancePage (End-to-end Cockpit Assembly)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(fixedDate);
    localStorage.clear();
    vi.clearAllMocks();

    useAuthContext.mockReturnValue({
      user: mockUser,
      isInitializing: false,
    });

    BalanceService.getBalance.mockResolvedValue(mockBalance);
    TransactionService.getAll.mockResolvedValue(mockTransactions);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial current-month defaults', () => {
    it('initializes with active current month date range, live balance metrics, and transactions table', async () => {
      const expectedFrom = format(startOfMonth(fixedDate), 'yyyy-MM-dd');
      const expectedTo = format(endOfMonth(fixedDate), 'yyyy-MM-dd');

      renderComponent();

      // Verify date range display in DatePicker
      expect(
        screen.getByRole('button', { name: /out 01, 2026 - out 31, 2026/i })
      ).toBeInTheDocument();

      // Wait for queries to resolve and assert live balance cards
      await waitFor(() => {
        expect(BalanceService.getBalance).toHaveBeenCalledWith({
          from: expectedFrom,
          to: expectedTo,
        });
        expect(TransactionService.getAll).toHaveBeenCalledWith({
          from: expectedFrom,
          to: expectedTo,
        });
      });

      // Wait for queries to resolve and assert live balance cards
      await waitFor(() => {
        expect(screen.getByTestId('kpi-card-revenue')).toHaveTextContent(/R\$\s*5\.000,00/);
      });

      const revenueCard = screen.getByTestId('kpi-card-revenue');
      expect(revenueCard).toHaveTextContent('Receita Total');
      expect(revenueCard).toHaveTextContent(/R\$\s*5\.000,00/);

      const expensesCard = screen.getByTestId('kpi-card-expenses');
      expect(expensesCard).toHaveTextContent('Despesas do Mês');
      expect(expensesCard).toHaveTextContent(/R\$\s*650,50/);

      const investmentsCard = screen.getByTestId('kpi-card-investments');
      expect(investmentsCard).toHaveTextContent('Investimentos Ativos');
      expect(investmentsCard).toHaveTextContent(/R\$\s*0,00/);

      const balanceCard = screen.getByTestId('kpi-card-balance');
      expect(balanceCard).toHaveTextContent('Saldo Geral');
      expect(balanceCard).toHaveTextContent(/R\$\s*4\.349,50/);

      // ChartAreaInteractive assertions
      expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Últimos 3 meses' })
      ).toBeInTheDocument();

      // TransactionsTable assertions
      await waitFor(() => {
        expect(
          screen.getByTestId('transactions-table-section')
        ).toBeInTheDocument();
        expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
        expect(screen.getByText('Supermercado Central')).toBeInTheDocument();
      });

      // URL search params synced
      await waitFor(() => {
        expect(lastLocation.search).toContain(`from=${expectedFrom}`);
        expect(lastLocation.search).toContain(`to=${expectedTo}`);
      });

      // LocalStorage saved preferences
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      expect(stored.from).toBe(expectedFrom);
      expect(stored.to).toBe(expectedTo);
    });
  });

  describe('Restoring saved preferences and URL synchronization', () => {
    it('restores saved filter and pagination preferences from localStorage (festrack:usr-1:finance_filters)', async () => {
      const savedPreferences = {
        from: '2026-05-01',
        to: '2026-05-31',
        q: 'supermercado',
        page: 0,
        pageSize: 10,
      };
      localStorage.setItem(storageKey, JSON.stringify(savedPreferences));

      renderComponent();

      // Verify queries called with stored date range
      await waitFor(() => {
        expect(BalanceService.getBalance).toHaveBeenCalledWith({
          from: '2026-05-01',
          to: '2026-05-31',
        });
        expect(TransactionService.getAll).toHaveBeenCalledWith({
          from: '2026-05-01',
          to: '2026-05-31',
        });
      });

      // Verify search input restored from storage
      const searchInput = await screen.findByPlaceholderText('Buscar por título...');
      expect(searchInput).toHaveValue('supermercado');

      // Verify URL synced with restored preferences
      await waitFor(() => {
        expect(lastLocation.search).toContain('from=2026-05-01');
        expect(lastLocation.search).toContain('to=2026-05-31');
        expect(lastLocation.search).toContain('q=supermercado');
      });

      // Only filtered rows visible
      expect(screen.getByText('Supermercado Central')).toBeInTheDocument();
      expect(screen.queryByText('Salário Mensal')).not.toBeInTheDocument();
    });

    it('synchronizes URL search parameters with localStorage, prioritizing URL', async () => {
      const savedPreferences = {
        from: '2026-01-01',
        to: '2026-01-31',
        q: 'old query',
        page: 0,
        pageSize: 10,
      };
      localStorage.setItem(storageKey, JSON.stringify(savedPreferences));

      renderComponent([
        '/finances?from=2026-08-01&to=2026-08-31&q=salario&page=1&pageSize=20',
      ]);

      await waitFor(() => {
        expect(BalanceService.getBalance).toHaveBeenCalledWith({
          from: '2026-08-01',
          to: '2026-08-31',
        });
      });

      // Search input takes URL value
      const searchInput = await screen.findByPlaceholderText('Buscar por título...');
      expect(searchInput).toHaveValue('salario');

      // LocalStorage updated from URL
      await waitFor(() => {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        expect(stored.from).toBe('2026-08-01');
        expect(stored.to).toBe('2026-08-31');
        expect(stored.q).toBe('salario');
        expect(stored.page).toBe('1');
        expect(stored.pageSize).toBe('20');
      });
    });
  });

  describe('Interactions with preset buttons', () => {
    it('updates parameters and child components when clicking Últimos 7 dias', async () => {
      renderComponent();

      const expectedTo = format(fixedDate, 'yyyy-MM-dd');
      const expectedFrom7d = format(subDays(fixedDate, 6), 'yyyy-MM-dd');

      const sevenDaysBtn = screen.getByRole('button', { name: 'Últimos 7 dias' });
      fireEvent.click(sevenDaysBtn);

      await waitFor(() => {
        expect(lastLocation.search).toContain(`from=${expectedFrom7d}`);
        expect(lastLocation.search).toContain(`to=${expectedTo}`);
      });

      expect(BalanceService.getBalance).toHaveBeenCalledWith({
        from: expectedFrom7d,
        to: expectedTo,
      });

      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
      expect(stored.from).toBe(expectedFrom7d);
      expect(stored.to).toBe(expectedTo);
    });

    it('updates parameters and child components when clicking Últimos 30 dias', async () => {
      renderComponent();

      const expectedTo = format(fixedDate, 'yyyy-MM-dd');
      const expectedFrom30d = format(subDays(fixedDate, 29), 'yyyy-MM-dd');

      const thirtyDaysBtn = screen.getByRole('button', {
        name: 'Últimos 30 dias',
      });
      fireEvent.click(thirtyDaysBtn);

      await waitFor(() => {
        expect(lastLocation.search).toContain(`from=${expectedFrom30d}`);
        expect(lastLocation.search).toContain(`to=${expectedTo}`);
      });

      expect(BalanceService.getBalance).toHaveBeenCalledWith({
        from: expectedFrom30d,
        to: expectedTo,
      });
    });

    it('updates parameters and child components when clicking Últimos 3 meses', async () => {
      renderComponent();

      // Click 7d first to switch away from the default 90d preset
      const sevenDaysBtn = screen.getByRole('button', {
        name: 'Últimos 7 dias',
      });
      fireEvent.click(sevenDaysBtn);

      const expectedTo = format(fixedDate, 'yyyy-MM-dd');
      const expectedFrom90d = format(subDays(fixedDate, 89), 'yyyy-MM-dd');

      const threeMonthsBtn = screen.getByRole('button', {
        name: 'Últimos 3 meses',
      });
      fireEvent.click(threeMonthsBtn);

      await waitFor(() => {
        expect(lastLocation.search).toContain(`from=${expectedFrom90d}`);
        expect(lastLocation.search).toContain(`to=${expectedTo}`);
      });

      expect(BalanceService.getBalance).toHaveBeenCalledWith({
        from: expectedFrom90d,
        to: expectedTo,
      });
    });
  });

  describe('Pagination navigation on the table', () => {
    const generateTransactions = (count) =>
      Array.from({ length: count }, (_, index) => ({
        id: `tx-${index + 1}`,
        name: `Transação #${index + 1}`,
        type: index % 2 === 0 ? 'EARNING' : 'EXPENSE',
        amount: (index + 1) * 100,
        date: '2026-10-10T12:00:00.000Z',
      }));

    it('navigates through pages and synchronizes page index with URL parameters', async () => {
      const manyTransactions = generateTransactions(25);
      TransactionService.getAll.mockResolvedValue(manyTransactions);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
      });

      expect(screen.getByText('Transação #1')).toBeInTheDocument();
      expect(screen.getByText('Transação #10')).toBeInTheDocument();
      expect(screen.queryByText('Transação #11')).not.toBeInTheDocument();

      // Click next page
      const nextPageBtn = screen.getByRole('button', { name: 'Próxima página' });
      fireEvent.click(nextPageBtn);

      await waitFor(() => {
        expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
      });

      expect(screen.getByText('Transação #11')).toBeInTheDocument();
      expect(screen.queryByText('Transação #1')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(lastLocation.search).toContain('page=1');
      });

      // Click previous page
      const prevPageBtn = screen.getByRole('button', { name: 'Página anterior' });
      fireEvent.click(prevPageBtn);

      await waitFor(() => {
        expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(lastLocation.search).toContain('page=0');
      });
    });
  });

  describe('Text search query filtering and URL updates', () => {
    it('updates URL search query and filters table rows interactively', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
        expect(screen.getByText('Supermercado Central')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar por título...');
      fireEvent.change(searchInput, { target: { value: 'Salário' } });

      await waitFor(() => {
        expect(lastLocation.search).toContain('q=Sal%C3%A1rio');
      });

      expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
      expect(screen.queryByText('Supermercado Central')).not.toBeInTheDocument();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Supermercado Central')).toBeInTheDocument();
        expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
      });
    });
  });

  describe('Loading and error states', () => {
    it('displays loading skeletons across SectionCards, Chart, and Table while queries are pending', () => {
      BalanceService.getBalance.mockReturnValue(new Promise(() => {}));
      TransactionService.getAll.mockReturnValue(new Promise(() => {}));

      renderComponent();

      // SectionCards loading skeleton
      expect(screen.getAllByTestId('kpi-skeleton').length).toBeGreaterThan(0);

      // Chart loading skeleton
      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();

      // Table loading skeleton
      expect(screen.getByTestId('transactions-loading')).toBeInTheDocument();
    });

    it('renders error state and retry action when queries fail', async () => {
      BalanceService.getBalance.mockRejectedValue(new Error('Falha de rede'));
      TransactionService.getAll.mockRejectedValue(new Error('Falha de rede'));

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('transactions-error')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('Não foi possível carregar as transações.')
      ).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
      expect(retryBtn).toBeInTheDocument();

      // Make queries succeed on retry
      BalanceService.getBalance.mockResolvedValue(mockBalance);
      TransactionService.getAll.mockResolvedValue(mockTransactions);

      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('Salário Mensal')).toBeInTheDocument();
      });
    });
  });
});
