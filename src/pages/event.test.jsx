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
    start_date: `${todayStr}T00:00:00.000Z`,
    end_date: `${todayStr}T23:59:59.000Z`,
    all_day: true,
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
    start_date: `${todayStr}T00:00:00.000Z`,
    end_date: `${todayStr}T23:59:59.000Z`,
    all_day: true,
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
          <MemoryRouter
            initialEntries={[`/events?view=month&date=${todayStr}`]}
          >
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

  it('renders page container with fluid layout below lg and fixed layout on desktop (lg:*) (#143)', async () => {
    const { container } = renderEventPageWithShopSwitcher();

    await screen.findAllByText('Casamento Imperial');

    const pageContainer = container.querySelector(
      '.relative.flex.flex-1.flex-col'
    );
    expect(pageContainer).toBeInTheDocument();
    expect(pageContainer).not.toHaveClass('absolute');

    const calendarWrapper = pageContainer.firstElementChild;
    expect(calendarWrapper).toBeInTheDocument();
    // On mobile (< lg): grows with content (no absolute inset-0 or overflow-hidden)
    expect(calendarWrapper).toHaveClass('bg-card', 'flex', 'flex-col', 'rounded-lg', 'border');
    expect(calendarWrapper).not.toHaveClass('absolute');
    expect(calendarWrapper).not.toHaveClass('inset-0');
    expect(calendarWrapper).not.toHaveClass('overflow-hidden');
    // On desktop (>= lg): lg:absolute lg:inset-0 lg:flex-row lg:overflow-hidden
    expect(calendarWrapper).toHaveClass(
      'lg:absolute',
      'lg:inset-0',
      'lg:flex-row',
      'lg:overflow-hidden'
    );
  });

  it('creates an All-Day Event sending all_day: true with UTC civil boundaries and renders it only on its civil day (#155)', async () => {
    const user = userEvent.setup();
    renderEventPageWithShopSwitcher();

    await screen.findAllByText('Casamento Imperial');

    protectedApi.post.mockResolvedValue({
      data: {
        id: 'ev-all-day-new',
        shop_id: 'shop-1',
        created_by_user_id: 'user-1',
        name: 'Feriado Civil',
        description: null,
        start_date: `${todayStr}T00:00:00.000Z`,
        end_date: `${todayStr}T23:59:59.000Z`,
        all_day: true,
        google_event_id: null,
        sync_error: false,
      },
    });

    const newEventButtons = await screen.findAllByRole('button', {
      name: /novo evento/i,
    });
    await user.click(newEventButtons[0]);

    const nameInput = await screen.findByLabelText(/nome do evento/i);
    await user.type(nameInput, 'Feriado Civil');

    const allDayCheckbox = screen.getByRole('checkbox', {
      name: /dia inteiro/i,
    });
    await user.click(allDayCheckbox);

    expect(screen.queryByLabelText(/hora inicial/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/hora final/i)).not.toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /criar evento/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-1/events',
        expect.objectContaining({
          name: 'Feriado Civil',
          all_day: true,
          start_date: `${todayStr}T00:00:00.000Z`,
          end_date: `${todayStr}T23:59:59.000Z`,
        })
      );
    });

    expect(screen.getAllByText('Casamento Imperial').length).toBeGreaterThan(0);
    const eventButtons = document.querySelectorAll('button[data-calendar-event]');
    expect(eventButtons.length).toBeGreaterThan(0);
    for (const btn of eventButtons) {
      expect(btn.textContent).not.toMatch(/03:00|02:59/);
    }
  });

  it('renders night-time Timed Event (22:00 - 23:30 local) returned in UTC on its local day and time across calendar views and sidebar (#156)', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const nightStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      22,
      0,
      0
    );
    const nightEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      30,
      0
    );

    const nightTimedRawEvent = {
      id: 'ev-night-156',
      shop_id: 'shop-1',
      created_by_user_id: 'user-1',
      name: 'Show Noturno',
      description: 'Atração principal',
      start_date: nightStart.toISOString(),
      end_date: nightEnd.toISOString(),
      all_day: false,
      google_event_id: null,
      sync_error: false,
    };

    protectedApi.get.mockImplementation((url) => {
      if (url === '/shops/shop-1/events') {
        return Promise.resolve({ data: [nightTimedRawEvent] });
      }
      return Promise.resolve({ data: [] });
    });

    const assertNoShiftedTimesOnEventButtons = () => {
      const eventButtons = document.querySelectorAll(
        'button[data-calendar-event]'
      );
      expect(eventButtons.length).toBeGreaterThan(0);
      for (const btn of eventButtons) {
        expect(btn.textContent).not.toMatch(/01:00|02:30/);
      }
    };

    renderEventPageWithShopSwitcher();

    expect(
      (await screen.findAllByText('Show Noturno')).length
    ).toBeGreaterThan(0);
    // Month view renders on today's cell with local start time; Sidebar shows full range
    const todayMonthCell = document.querySelector(
      '[data-slot="month-day-cell"][data-today="true"]'
    );
    expect(todayMonthCell).toBeInTheDocument();
    expect(todayMonthCell.textContent).toContain('Show Noturno');
    expect(todayMonthCell.textContent).toContain('22:00');
    expect(screen.getByText('22:00 - 23:30')).toBeInTheDocument();
    assertNoShiftedTimesOnEventButtons();

    // Switch to Week view
    await user.click(screen.getByRole('button', { name: /mês/i }));
    await user.click(await screen.findByRole('menuitem', { name: /semana/i }));
    await waitFor(() => {
      expect(document.querySelector('[data-slot="week-view"]')).toBeInTheDocument();
    });
    expect(screen.getAllByText('22:00 - 23:30').length).toBeGreaterThanOrEqual(2);
    assertNoShiftedTimesOnEventButtons();

    // Switch to Day view
    await user.click(screen.getByRole('button', { name: /semana/i }));
    await user.click(await screen.findByRole('menuitem', { name: /dia/i }));
    await waitFor(() => {
      expect(document.querySelector('[data-slot="day-view"]')).toBeInTheDocument();
    });
    expect(screen.getAllByText('22:00 - 23:30').length).toBeGreaterThanOrEqual(2);
    assertNoShiftedTimesOnEventButtons();

    // Switch to Agenda view
    await user.click(screen.getByRole('button', { name: /dia/i }));
    await user.click(await screen.findByRole('menuitem', { name: /agenda/i }));
    await waitFor(() => {
      expect(document.querySelector('[data-slot="agenda-view"]')).toBeInTheDocument();
    });
    expect(screen.getAllByText('22:00 - 23:30').length).toBeGreaterThanOrEqual(2);
    assertNoShiftedTimesOnEventButtons();
  });
});
