import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useDeleteEvent, useGetEvent } from '@/features/events/api/hooks';
import { AppRoutes } from '@/main';
import EventDetailPage from '@/pages/event-detail';

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

const renderWithProviders = (ui, { route = '/event/ev-123' } = {}) => {
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
      user: { id: 'user-1', name: 'Test User' },
      isInitializing: false,
    });
    useDeleteEvent.mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
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
        <Route path="/event/:eventId" element={<EventDetailPage />} />
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
        <Route path="/event/:eventId" element={<EventDetailPage />} />
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
        <Route path="/event/:eventId" element={<EventDetailPage />} />
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
        <Route path="/event/:eventId" element={<EventDetailPage />} />
      </Routes>
    );

    expect(screen.getByText('Viagem Florianópolis')).toBeInTheDocument();
    expect(
      screen.getByText('Férias de verão com amigos')
    ).toBeInTheDocument();
    expect(screen.getByText(/01\/12\/2026 até 10\/12\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/agendado|em andamento|finalizado/i)).toBeInTheDocument();
  });

  it('renders "Voltar ao calendário" button and navigates to /event on click', () => {
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
          <Route path="/event" element={<div>Calendar View Page</div>} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
        </Routes>
      </>
    );

    const backButton = screen.getByRole('button', {
      name: /voltar ao calendário/i,
    });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);

    expect(currentPathname).toBe('/event');
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
        <Route path="/event/:eventId" element={<EventDetailPage />} />
      </Routes>
    );

    expect(
      screen.getByRole('button', { name: /nova transação/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /editar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /excluir/i })
    ).toBeInTheDocument();
  });

  it('smoothly redirects to /event with success toast upon deleting event', async () => {
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
          <Route path="/event" element={<div>Calendar View Page</div>} />
          <Route path="/event/:eventId" element={<EventDetailPage />} />
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
      expect(currentPathname).toBe('/event');
    });
  });

  it('mounts EventDetailPage via /event/:eventId within application AppRoutes', () => {
    useGetEvent.mockReturnValue({
      data: mockEvent,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<AppRoutes />, { route: '/event/ev-123' });

    expect(screen.getByText('Viagem Florianópolis')).toBeInTheDocument();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
  });
});
