import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useDeleteEvent, useGetEvent } from '@/features/events/api/hooks';
import { useGetTransactions } from '@/features/finances';
import { AppRoutes } from '@/main';
import EventDetailPage from '@/pages/event-detail';

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

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/events/api/hooks', async () => {
  const actual = await vi.importActual('@/features/events/api/hooks');
  return {
    ...actual,
    useGetEvent: vi.fn(),
    useDeleteEvent: vi.fn(),
  };
});

vi.mock('@/features/finances/api/hooks', async () => {
  const actual = await vi.importActual('@/features/finances/api/hooks');
  return {
    ...actual,
    useGetTransactions: vi.fn(),
  };
});

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

// Mock layout subcomponents when mounting DashboardLayout to isolate routing
vi.mock('@/components/layout/app-sidebar', () => ({
  default: () => <div data-testid="app-sidebar">Sidebar</div>,
}));

vi.mock('@/components/layout/header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

const mockEvent = {
  id: 'ev-123',
  name: 'Viagem Florianópolis',
  description: 'Férias de verão com amigos',
  startDate: '2026-12-01T00:00:00.000Z',
  endDate: '2026-12-10T23:59:59.000Z',
  allDay: true,
  googleEventId: null,
  syncError: false,
};

const renderWithProviders = (ui, { route = '/events/ev-123' } = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EventDetailPage', () => {
  const mockDeleteMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: { id: 'user-1', firstName: 'Test', name: 'Test User' },
      isInitializing: false,
    });
    useDeleteEvent.mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    });
    useGetTransactions.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  it('renders skeleton loading state while fetching event data', () => {
    useGetEvent.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Routes>
    );

    expect(screen.getByTestId('event-detail-skeleton')).toBeInTheDocument();
  });

  it('renders error state and retry action when event request fails', () => {
    const mockRefetch = vi.fn();
    useGetEvent.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    renderWithProviders(
      <Routes>
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Routes>
    );

    expect(
      screen.getByText(/não foi possível carregar o evento/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders not found state when event does not exist', () => {
    useGetEvent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Routes>
    );

    expect(screen.getByText(/evento não encontrado/i)).toBeInTheDocument();
  });

  it('renders event details: title, description, formatted date, and status badge', () => {
    useGetEvent.mockReturnValue({
      data: mockEvent,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Routes>
    );

    expect(screen.getByText('Viagem Florianópolis')).toBeInTheDocument();
    expect(screen.getByText('Férias de verão com amigos')).toBeInTheDocument();
    expect(
      screen.getByText(/01\/12\/2026 até 10\/12\/2026/)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/agendado|em andamento|finalizado/i).length
    ).toBeGreaterThan(0);
  });

  it('renders "Voltar ao calendário" button and navigates to /events on click', () => {
    useGetEvent.mockReturnValue({
      data: mockEvent,
      isLoading: false,
      isError: false,
    });

    let currentPathname = '';
    const LocationWatcher = () => {
      const location = useLocation();
      currentPathname = location.pathname;
      return null;
    };

    renderWithProviders(
      <>
        <LocationWatcher />
        <Routes>
          <Route path="/events" element={<div>Calendar View Page</div>} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      </>
    );

    const backButton = screen.getByRole('button', {
      name: /voltar ao calendário/i,
    });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);

    expect(currentPathname).toBe('/events');
    expect(screen.getByText('Calendar View Page')).toBeInTheDocument();
  });

  it('renders quick action buttons: Nova transação, Editar, and Excluir', () => {
    useGetEvent.mockReturnValue({
      data: mockEvent,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <Routes>
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Routes>
    );

    expect(
      screen.getByRole('button', { name: /nova transação/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /excluir/i })
    ).toBeInTheDocument();
  });

  it('smoothly redirects to /events with success toast upon deleting event', async () => {
    mockDeleteMutateAsync.mockResolvedValueOnce({ id: 'ev-123' });

    useGetEvent.mockReturnValue({
      data: mockEvent,
      isLoading: false,
      isError: false,
    });

    let currentPathname = '';
    const LocationWatcher = () => {
      const location = useLocation();
      currentPathname = location.pathname;
      return null;
    };

    renderWithProviders(
      <>
        <LocationWatcher />
        <Routes>
          <Route path="/events" element={<div>Calendar View Page</div>} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      </>
    );

    const deleteTrigger = screen.getByRole('button', { name: /excluir/i });
    fireEvent.click(deleteTrigger);

    const confirmButton = await screen.findByRole('button', {
      name: 'Excluir evento',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({ id: 'ev-123' });
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Evento excluído com sucesso!',
        })
      );
      expect(currentPathname).toBe('/events');
    });
  });

  it('mounts EventDetailPage via /events/:eventId within application AppRoutes without duplicate main landmarks', () => {
    useGetEvent.mockReturnValue({
      data: mockEvent,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<AppRoutes />, { route: '/events/ev-123' });

    expect(screen.getByText('Viagem Florianópolis')).toBeInTheDocument();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('redirects legacy /event/:eventId to /events/:eventId within application AppRoutes', () => {
    useGetEvent.mockReturnValue({
      data: mockEvent,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<AppRoutes />, { route: '/event/ev-123' });

    expect(screen.getByText('Viagem Florianópolis')).toBeInTheDocument();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });

  describe('Event Financial KPI Metrics Cards and Transactions Table (#42, #67)', () => {
    const mockTransactions = [
      {
        id: 'tx-1',
        name: 'Passagem Aérea',
        type: 'EXPENSE',
        amount: 1500,
        date: '2026-12-02T12:00:00.000Z',
        eventId: 'ev-123',
      },
      {
        id: 'tx-2',
        name: 'Patrocínio Amigos',
        type: 'EARNING',
        amount: 3200,
        date: '2026-12-03T12:00:00.000Z',
        eventId: 'ev-123',
      },
      {
        id: 'tx-3',
        name: 'Reserva Hotel',
        type: 'INVESTMENT',
        amount: 700,
        date: '2026-12-04T12:00:00.000Z',
        eventId: 'ev-123',
      },
    ];

    it('calculates and displays accurate totals, volume shares, and area charts for EARNING, EXPENSE, INVESTMENT, and Net Balance in BRL', () => {
      useGetEvent.mockReturnValue({
        data: mockEvent,
        isLoading: false,
        isError: false,
      });
      useGetTransactions.mockReturnValue({
        data: mockTransactions,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      );

      // Total de Receitas: 3200 (59% of 5400)
      const earningsCard = screen.getByTestId('kpi-earnings');
      expect(earningsCard).toHaveTextContent('Total de Receitas');
      expect(earningsCard).toHaveTextContent(/R\$\s*3\.200,00/);
      expect(earningsCard).toHaveTextContent('59%');
      expect(earningsCard).toHaveTextContent('do volume do evento');
      expect(
        earningsCard.querySelector('[data-slot="chart"]')
      ).toBeInTheDocument();

      // Total de Despesas: 1500 (28% of 5400)
      const expensesCard = screen.getByTestId('kpi-expenses');
      expect(expensesCard).toHaveTextContent('Total de Despesas');
      expect(expensesCard).toHaveTextContent(/R\$\s*1\.500,00/);
      expect(expensesCard).toHaveTextContent('28%');
      expect(expensesCard).toHaveTextContent('do volume do evento');
      expect(
        expensesCard.querySelector('[data-slot="chart"]')
      ).toBeInTheDocument();

      // Total de Investimentos: 700 (13% of 5400)
      const investmentsCard = screen.getByTestId('kpi-investments');
      expect(investmentsCard).toHaveTextContent('Total de Investimentos');
      expect(investmentsCard).toHaveTextContent(/R\$\s*700,00/);
      expect(investmentsCard).toHaveTextContent('13%');
      expect(investmentsCard).toHaveTextContent('do volume do evento');
      expect(
        investmentsCard.querySelector('[data-slot="chart"]')
      ).toBeInTheDocument();

      // Balanço do Evento & Saldo Líquido: 3200 - (1500 + 700) = 1000
      const balanceOverviewCard = screen.getByTestId(
        'event-balance-overview-card'
      );
      expect(balanceOverviewCard).toHaveTextContent('Balanço do Evento');
      expect(balanceOverviewCard).toHaveTextContent('Total de Entradas');
      expect(balanceOverviewCard).toHaveTextContent(/R\$\s*3\.200,00/);
      expect(balanceOverviewCard).toHaveTextContent('Total de Saídas');
      expect(balanceOverviewCard).toHaveTextContent(/R\$\s*2\.200,00/);

      const netBalanceCard = screen.getByTestId('kpi-net-balance');
      expect(netBalanceCard).toHaveTextContent('Saldo Líquido');
      expect(netBalanceCard).toHaveTextContent(/R\$\s*1\.000,00/);
    });

    it('renders transactions table with proper columns, badges, dates, amounts, and row actions', async () => {
      const user = userEvent.setup();
      useGetEvent.mockReturnValue({
        data: mockEvent,
        isLoading: false,
        isError: false,
      });
      useGetTransactions.mockReturnValue({
        data: mockTransactions,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      );

      // Check table column headers
      const table = screen.getByRole('table');
      const tableScope = within(table);

      expect(
        tableScope.getByRole('button', { name: /título/i })
      ).toBeInTheDocument();
      expect(
        tableScope.getByRole('button', { name: /tipo/i })
      ).toBeInTheDocument();
      expect(
        tableScope.getByRole('button', { name: /data/i })
      ).toBeInTheDocument();
      expect(
        tableScope.getByRole('button', { name: /valor/i })
      ).toBeInTheDocument();
      expect(tableScope.getByText('Ações')).toBeInTheDocument();

      // Check rows content
      expect(tableScope.getByText('Passagem Aérea')).toBeInTheDocument();
      expect(tableScope.getByText('Gasto')).toBeInTheDocument();
      expect(
        tableScope.getByText(/02 de dezembro de 2026/)
      ).toBeInTheDocument();
      expect(tableScope.getByText(/R\$\s*1\.500,00/)).toBeInTheDocument();

      expect(tableScope.getByText('Patrocínio Amigos')).toBeInTheDocument();
      expect(tableScope.getByText('Ganho')).toBeInTheDocument();
      expect(
        tableScope.getByText(/03 de dezembro de 2026/)
      ).toBeInTheDocument();
      expect(tableScope.getByText(/R\$\s*3\.200,00/)).toBeInTheDocument();

      expect(tableScope.getByText('Reserva Hotel')).toBeInTheDocument();
      expect(tableScope.getByText('Investimento')).toBeInTheDocument();
      expect(
        tableScope.getByText(/04 de dezembro de 2026/)
      ).toBeInTheDocument();
      expect(tableScope.getByText(/R\$\s*700,00/)).toBeInTheDocument();

      // Row action buttons
      const actionButtons = tableScope.getAllByRole('button', {
        name: /ações da transação/i,
      });
      expect(actionButtons.length).toBe(3);

      await user.click(actionButtons[0]);

      expect(
        await screen.findByRole('menuitem', { name: /editar/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: /excluir/i })
      ).toBeInTheDocument();
    });

    it('renders empty state when transaction list is empty with an actionable CTA button', () => {
      useGetEvent.mockReturnValue({
        data: mockEvent,
        isLoading: false,
        isError: false,
      });
      useGetTransactions.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      });

      renderWithProviders(
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      );

      expect(
        screen.getByTestId('event-transactions-empty')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nenhuma transação encontrada')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nenhuma transação registrada para este evento.')
      ).toBeInTheDocument();

      const addBtn = screen.getByRole('button', {
        name: /adicionar transação/i,
      });
      expect(addBtn).toBeInTheDocument();
    });

    it('reactively recomputes KPI cards when transactions are updated', () => {
      useGetEvent.mockReturnValue({
        data: mockEvent,
        isLoading: false,
        isError: false,
      });

      const { rerender } = renderWithProviders(
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      );

      // Initially empty
      expect(screen.getByTestId('kpi-net-balance')).toHaveTextContent(
        /R\$\s*0,00/
      );

      // Now transactions arrive/update
      useGetTransactions.mockReturnValue({
        data: [
          {
            id: 'tx-new',
            name: 'Premiação',
            type: 'EARNING',
            amount: 4500,
            date: '2026-12-05T12:00:00.000Z',
            eventId: 'ev-123',
          },
        ],
        isLoading: false,
        isError: false,
      });

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={['/events/ev-123']}>
            <Routes>
              <Route path="/events/:eventId" element={<EventDetailPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('kpi-earnings')).toHaveTextContent(
        /R\$\s*4\.500,00/
      );
      expect(screen.getByTestId('kpi-net-balance')).toHaveTextContent(
        /R\$\s*4\.500,00/
      );
    });

    it('renders operational StatCards with accurate status, transaction count, average expense, and max expense for populated and empty ledgers (#68)', () => {
      useGetEvent.mockReturnValue({
        data: mockEvent,
        isLoading: false,
        isError: false,
      });
      useGetTransactions.mockReturnValue({
        data: [
          ...mockTransactions,
          {
            id: 'tx-4',
            name: 'Hospedagem Extra',
            type: 'EXPENSE',
            amount: 500,
            date: '2026-12-05T12:00:00.000Z',
            eventId: 'ev-123',
          },
        ],
        isLoading: false,
        isError: false,
      });

      const { rerender } = renderWithProviders(
        <Routes>
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Routes>
      );

      const statusCard = screen.getByTestId('stat-status');
      expect(statusCard).toHaveTextContent('Status do Evento');
      expect(statusCard).toHaveTextContent(/Agendado|Em andamento|Finalizado/);

      const countCard = screen.getByTestId('stat-transactions-count');
      expect(countCard).toHaveTextContent('Total de Transações');
      expect(countCard).toHaveTextContent('4');
      expect(countCard).toHaveTextContent('4 lançamentos');

      // Expenses: 1500 + 500 = 2000 -> average = 1000
      const avgExpenseCard = screen.getByTestId('stat-average-expense');
      expect(avgExpenseCard).toHaveTextContent('Ticket Médio de Despesa');
      expect(avgExpenseCard).toHaveTextContent(/R\$\s*1\.000,00/);
      expect(avgExpenseCard).toHaveTextContent('Média por gasto');

      // Max expense: Passagem Aérea (1500)
      const maxExpenseCard = screen.getByTestId('stat-max-expense');
      expect(maxExpenseCard).toHaveTextContent('Maior Despesa');
      expect(maxExpenseCard).toHaveTextContent(/R\$\s*1\.500,00/);
      expect(maxExpenseCard).toHaveTextContent('Passagem Aérea');

      // Empty transactions state
      useGetTransactions.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
      });

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter initialEntries={['/events/ev-123']}>
            <Routes>
              <Route path="/events/:eventId" element={<EventDetailPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('stat-transactions-count')).toHaveTextContent(
        '0 lançamentos'
      );
      expect(screen.getByTestId('stat-average-expense')).toHaveTextContent(
        /R\$\s*0,00/
      );
      expect(screen.getByTestId('stat-max-expense')).toHaveTextContent(
        /R\$\s*0,00/
      );
      expect(screen.getByTestId('stat-max-expense')).toHaveTextContent(
        'Nenhuma despesa'
      );
    });
  });
});
