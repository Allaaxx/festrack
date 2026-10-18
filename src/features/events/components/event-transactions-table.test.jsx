import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import { useGetTransactions } from '@/features/finances/api/hooks';

import EventTransactionsTable from './event-transactions-table';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/finances/api/hooks', async () => {
  const actual = await vi.importActual('@/features/finances/api/hooks');
  return {
    ...actual,
    useGetTransactions: vi.fn(),
  };
});

const renderWithClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

const mockTransactions = [
  {
    id: 'tx-1',
    name: 'Passagens Aéreas',
    type: 'EXPENSE',
    amount: 1450.75,
    date: '2026-10-15T12:00:00.000Z',
    eventId: 'ev-123',
  },
  {
    id: 'tx-2',
    name: 'Reembolso Empresa',
    type: 'EARNING',
    amount: 1000,
    date: '2026-10-20T12:00:00.000Z',
    eventId: 'ev-123',
  },
  {
    id: 'tx-3',
    name: 'Fundo Viagem Tesouro',
    type: 'INVESTMENT',
    amount: 500,
    date: '2026-10-25T12:00:00.000Z',
    eventId: 'ev-123',
  },
];

describe('EventTransactionsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: { id: 'user-1', firstName: 'Allan', name: 'Allan Rodrigues' },
    });
  });

  it('renders skeleton loading state while transactions are loading', () => {
    useGetTransactions.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    renderWithClient(<EventTransactionsTable eventId="ev-123" />);

    expect(
      screen.getByTestId('event-transactions-skeleton')
    ).toBeInTheDocument();
  });

  it('renders error state and handles refetch retry when query fails', () => {
    const mockRefetch = vi.fn();
    useGetTransactions.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    renderWithClient(<EventTransactionsTable eventId="ev-123" />);

    expect(
      screen.getByText(/não foi possível carregar as transações/i)
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state with "Adicionar transação" CTA button when event has no transactions', () => {
    useGetTransactions.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderWithClient(<EventTransactionsTable eventId="ev-123" />);

    expect(screen.getByTestId('event-transactions-empty')).toBeInTheDocument();
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

  it('renders table headers: Título, Tipo, Data, Valor, and Ações', () => {
    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
    });

    renderWithClient(<EventTransactionsTable eventId="ev-123" />);

    expect(screen.getByRole('button', { name: /título/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tipo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /valor/i })).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });

  it('renders table rows with transaction name, badges, formatted dates and currencies', () => {
    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
    });

    renderWithClient(<EventTransactionsTable eventId="ev-123" />);

    // Row 1: Passagens Aéreas - EXPENSE - R$ 1.450,75
    expect(screen.getByText('Passagens Aéreas')).toBeInTheDocument();
    expect(screen.getByText('Gasto')).toBeInTheDocument();
    expect(screen.getByText(/15 de outubro de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*1\.450,75/)).toBeInTheDocument();

    // Row 2: Reembolso Empresa - EARNING - R$ 1.000,00
    expect(screen.getByText('Reembolso Empresa')).toBeInTheDocument();
    expect(screen.getByText('Ganho')).toBeInTheDocument();
    expect(screen.getByText(/20 de outubro de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*1\.000,00/)).toBeInTheDocument();

    // Row 3: Fundo Viagem Tesouro - INVESTMENT - R$ 500,00
    expect(screen.getByText('Fundo Viagem Tesouro')).toBeInTheDocument();
    expect(screen.getByText('Investimento')).toBeInTheDocument();
    expect(screen.getByText(/25 de outubro de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*500,00/)).toBeInTheDocument();
  });

  it('renders row action buttons for editing and deleting each transaction', async () => {
    const user = userEvent.setup();
    useGetTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      isError: false,
    });

    renderWithClient(<EventTransactionsTable eventId="ev-123" />);

    // Each row has an action dropdown button
    const actionButtons = screen.getAllByRole('button', {
      name: /ações da transação/i,
    });
    expect(actionButtons.length).toBe(3);

    // Opening an action dropdown displays Edit and Delete menu options
    await user.click(actionButtons[0]);

    expect(
      await screen.findByRole('menuitem', { name: /editar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /excluir/i })
    ).toBeInTheDocument();
  });
});
