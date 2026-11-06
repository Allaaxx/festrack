import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ShopSwitcher from '@/components/layout/shop-switcher';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuthContext } from '@/contexts/auth';
import { ShopContextProvider } from '@/contexts/shop';
import { ShopService } from '@/features/shops';
import protectedApi from '@/lib/axios';
import EventPage from '@/pages/event';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/shops/api/services', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/axios', () => {
  const mockProtectedApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockProtectedApi,
    protectedApi: mockProtectedApi,
  };
});

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

const todayStr = format(new Date(), 'yyyy-MM-dd');

const mockShops = [
  {
    id: 'shop-1',
    name: 'Atelier Central',
    description: 'Matriz',
    role: 'OWNER',
  },
  {
    id: 'shop-2',
    name: 'Buffet Jardim',
    description: 'Filial',
    role: 'MEMBER',
  },
];

const shop1RawEvents = [
  {
    id: 'ev-shop-1',
    shop_id: 'shop-1',
    created_by_user_id: 'user-1',
    name: 'Casamento Imperial',
    description: 'Recepção na Matriz',
    start_date: `${todayStr}T00:00:00`,
    end_date: `${todayStr}T23:59:00`,
    google_event_id: null,
    sync_error: false,
  },
];

const shop2RawEvents = [
  {
    id: 'ev-shop-2',
    shop_id: 'shop-2',
    created_by_user_id: 'user-2',
    name: 'Formatura Medicina',
    description: 'Baile na Filial',
    start_date: `${todayStr}T00:00:00`,
    end_date: `${todayStr}T23:59:00`,
    google_event_id: null,
    sync_error: false,
  },
];

const renderEventPageWithShopSwitcher = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ShopContextProvider>
          <MemoryRouter initialEntries={[`/events?view=month&date=${todayStr}`]}>
            <SidebarProvider defaultOpen={true}>
              <ShopSwitcher />
              <Routes>
                <Route path="/events" element={<EventPage />} />
              </Routes>
            </SidebarProvider>
          </MemoryRouter>
        </ShopContextProvider>
      </QueryClientProvider>
    ),
  };
};

describe('EventPage - Shop-Scoped Events & ShopSwitcher Integration (#83)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthContext.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Maria Silva',
        email: 'maria@example.com',
        googleCalendarSyncEnabled: false,
      },
      isInitializing: false,
    });
    ShopService.getAll.mockResolvedValue(mockShops);
    protectedApi.get.mockImplementation((url) => {
      if (url === '/shops/shop-1/events') {
        return Promise.resolve({ data: shop1RawEvents });
      }
      if (url === '/shops/shop-2/events') {
        return Promise.resolve({ data: shop2RawEvents });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('loads events strictly for the active shop and refetches on ShopSwitcher switch without cross-shop data leaks', async () => {
    const user = userEvent.setup();
    renderEventPageWithShopSwitcher();

    await waitFor(() => {
      expect(protectedApi.get).toHaveBeenCalledWith('/shops/shop-1/events');
    });

    expect(
      (await screen.findAllByText('Casamento Imperial')).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Formatura Medicina')).not.toBeInTheDocument();

    // Switch active shop via ShopSwitcher in sidebar
    const switcherTrigger = screen.getByRole('button', {
      name: /atelier central/i,
    });
    await user.click(switcherTrigger);

    const shop2Option = await screen.findByRole('menuitem', {
      name: /buffet jardim/i,
    });
    await user.click(shop2Option);

    await waitFor(() => {
      expect(protectedApi.get).toHaveBeenCalledWith('/shops/shop-2/events');
    });

    expect(
      (await screen.findAllByText('Formatura Medicina')).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Casamento Imperial')).not.toBeInTheDocument();
  });

  it('creates an event within the active shop (/shops/:shopId/events) and invalidates the active shop event query', async () => {
    const user = userEvent.setup();
    const { queryClient } = renderEventPageWithShopSwitcher();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    await waitFor(() => {
      expect(protectedApi.get).toHaveBeenCalledWith('/shops/shop-1/events');
    });

    protectedApi.post.mockResolvedValue({
      data: {
        id: 'ev-new-1',
        shop_id: 'shop-1',
        created_by_user_id: 'user-1',
        name: 'Evento Corporativo',
        description: 'Workshop anual',
        start_date: `${todayStr}T09:00:00.000Z`,
        end_date: `${todayStr}T18:00:00.000Z`,
        google_event_id: null,
        sync_error: false,
      },
    });

    const newEventButtons = await screen.findAllByRole('button', {
      name: /novo evento/i,
    });
    await user.click(newEventButtons[0]);

    const nameInput = await screen.findByLabelText(/nome do evento/i);
    await user.type(nameInput, 'Evento Corporativo');

    const saveButton = screen.getByRole('button', { name: /criar evento/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-1/events',
        expect.objectContaining({
          name: 'Evento Corporativo',
        })
      );
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['getEvents', 'shop-1'],
    });
  });
});
