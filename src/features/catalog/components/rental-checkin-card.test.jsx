import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useGetRentals, useRentalCheckIn } from '@/features/catalog/api/rentals';
import RentalCheckinCard from '@/features/catalog/components/rental-checkin-card';

vi.mock('@/features/catalog/api/rentals', async () => {
  const actual = await vi.importActual('@/features/catalog/api/rentals');
  return {
    ...actual,
    useGetRentals: vi.fn(),
    useRentalCheckIn: vi.fn(),
  };
});

describe('RentalCheckinCard Component (#116)', () => {
  let queryClient;

  const mockRentals = [
    {
      id: 'rental-1',
      customerName: 'Mariana Souza',
      eventName: 'Casamento Mariana & Thiago',
      status: 'pending_return',
      scheduledDates: '08 Nov - 12 Nov 2026',
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productName: 'Mesa Rústica Retangular 2m',
          quantity: 2,
        },
        {
          id: 'item-2',
          productId: 'prod-2',
          productName: 'Bolo Cenográfico Fake 3 Andares',
          quantity: 1,
        },
      ],
    },
    {
      id: 'rental-2',
      customerName: 'Carlos Eduardo',
      eventName: 'Aniversário de 15 Anos Julia',
      status: 'active',
      scheduledDates: '11 Nov - 14 Nov 2026',
      items: [
        {
          id: 'item-3',
          productId: 'prod-3',
          productName: 'Suporte para Doces Dourado',
          quantity: 6,
        },
      ],
    },
    {
      id: 'rental-3',
      customerName: 'Beatriz Almeida',
      eventName: 'Chá Revelação Bernardo',
      status: 'reserved',
      scheduledDates: '15 Nov - 17 Nov 2026',
      items: [
        {
          id: 'item-4',
          productId: 'prod-2',
          productName: 'Bolo Cenográfico Fake 3 Andares',
          quantity: 1,
        },
      ],
    },
    {
      id: 'rental-4',
      customerName: 'Felipe Santos',
      eventName: 'Formatura Medicina Turma 2026',
      status: 'inspected',
      scheduledDates: '05 Nov - 08 Nov 2026',
      items: [
        {
          id: 'item-5',
          productId: 'prod-1',
          productName: 'Mesa Rústica Retangular 2m',
          quantity: 4,
          returnedQuantity: 4,
          lossQuantity: 0,
        },
      ],
    },
  ];

  const renderCard = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RentalCheckinCard {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    useGetRentals.mockReturnValue({
      data: {
        rentals: mockRentals,
        onTimeReturnRate: 92,
      },
      isLoading: false,
    });

    useRentalCheckIn.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders card header with title, subtitle, and on-time return rate progress bar', () => {
    renderCard();

    expect(screen.getByText('Controle de Locações')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Acompanhe entregas, retiradas e devoluções para eventos'
      )
    ).toBeInTheDocument();

    expect(screen.getByText(/92%/i)).toBeInTheDocument();
    expect(
      screen.getByText(/taxa de devoluções no prazo/i)
    ).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('renders all 4 tabs and defaults to Retorno Pendente', () => {
    renderCard();

    expect(
      screen.getByRole('tab', { name: /retorno pendente/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /em evento/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /reservados/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /inspecionados/i })
    ).toBeInTheDocument();

    // Default tab shows Mariana Souza
    expect(screen.getByText(/Mariana Souza/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Casamento Mariana & Thiago/i)
    ).toBeInTheDocument();
    expect(screen.getByText('08 Nov - 12 Nov 2026')).toBeInTheDocument();
    expect(
      screen.getByText(
        /2x Mesa Rústica Retangular 2m, 1x Bolo Cenográfico Fake 3 Andares/i
      )
    ).toBeInTheDocument();

    // Button to trigger check-in
    expect(
      screen.getByRole('button', { name: /registrar check-in/i })
    ).toBeInTheDocument();
  });

  it('switches tabs and displays corresponding rentals on the timeline', async () => {
    const user = userEvent.setup();
    renderCard();

    // Switch to "Em Evento"
    const activeTab = screen.getByRole('tab', { name: /em evento/i });
    await user.click(activeTab);

    expect(screen.getByText(/Carlos Eduardo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Aniversário de 15 Anos Julia/i)
    ).toBeInTheDocument();

    // Switch to "Reservados"
    const reservedTab = screen.getByRole('tab', { name: /reservados/i });
    await user.click(reservedTab);

    expect(screen.getByText(/Beatriz Almeida/i)).toBeInTheDocument();
    expect(screen.getByText(/Chá Revelação Bernardo/i)).toBeInTheDocument();

    // Switch to "Inspecionados"
    const inspectedTab = screen.getByRole('tab', { name: /inspecionados/i });
    await user.click(inspectedTab);

    expect(screen.getByText(/Felipe Santos/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Formatura Medicina Turma 2026/i)
    ).toBeInTheDocument();
  });

  it('opens check-in dialog when clicking Registrar Check-in button', async () => {
    const user = userEvent.setup();
    renderCard();

    const checkinBtn = screen.getByRole('button', {
      name: /registrar check-in/i,
    });
    await user.click(checkinBtn);

    // Dialog should open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByText('Check-in de Locação')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByText(/Mariana Souza/i)
    ).toBeInTheDocument();
  });

  it('displays empty state when there are no rentals in the selected tab', async () => {
    useGetRentals.mockReturnValue({
      data: {
        rentals: [],
        onTimeReturnRate: 100,
      },
      isLoading: false,
    });

    renderCard();

    expect(
      screen.getByText(/nenhuma locação encontrada nesta etapa/i)
    ).toBeInTheDocument();
  });
});
