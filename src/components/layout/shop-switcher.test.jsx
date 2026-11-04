import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ShopSwitcher from '@/components/layout/shop-switcher';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { ShopContextProvider } from '@/contexts/shop';
import ShopService from '@/features/shops/api/services';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
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

const LocationDisplay = () => {
  const location = useLocation();
  return (
    <div data-testid="current-location">
      {location.pathname}
      {location.search}
    </div>
  );
};

describe('ShopSwitcher Integration', () => {
  let queryClient;

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

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAuthContext.mockReturnValue({
      user: { id: 'user-1', email: 'maria@example.com' },
      isInitializing: false,
    });
  });

  const renderShopSwitcher = (initialEntry = '/finances') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ShopContextProvider>
          <MemoryRouter initialEntries={[initialEntry]}>
            <SidebarProvider>
              <ShopSwitcher />
              <Routes>
                <Route path="*" element={<LocationDisplay />} />
              </Routes>
            </SidebarProvider>
          </MemoryRouter>
        </ShopContextProvider>
      </QueryClientProvider>
    );
  };

  it('displays active shop initial, name, and role, and switches active shop on selection', async () => {
    const user = userEvent.setup();
    ShopService.getAll.mockResolvedValue(mockShops);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderShopSwitcher();

    const triggerButton = await screen.findByRole('button', {
      name: /atelier central/i,
    });
    expect(triggerButton).toHaveTextContent('A');
    expect(triggerButton).toHaveTextContent('Atelier Central');
    expect(triggerButton).toHaveTextContent('Proprietário');

    await user.click(triggerButton);

    const secondShopItem = await screen.findByRole('menuitem', {
      name: /buffet jardim/i,
    });
    expect(secondShopItem).toHaveTextContent('Membro');

    await user.click(secondShopItem);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /buffet jardim/i })
      ).toHaveTextContent('Membro');
    });

    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-2');
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('navigates to /settings?tab=loja when clicking "Configurações da Loja"', async () => {
    const user = userEvent.setup();
    ShopService.getAll.mockResolvedValue(mockShops);

    renderShopSwitcher('/finances');

    const triggerButton = await screen.findByRole('button', {
      name: /atelier central/i,
    });
    await user.click(triggerButton);

    const settingsItem = await screen.findByRole('menuitem', {
      name: /configurações da loja/i,
    });
    await user.click(settingsItem);

    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(
        '/settings?tab=loja'
      );
    });
  });

  it('opens CreateShopDialog when clicking "Adicionar Loja" and switches to the newly created shop', async () => {
    const user = userEvent.setup();
    ShopService.getAll.mockResolvedValue(mockShops);
    ShopService.create.mockResolvedValue({
      id: 'shop-3',
      name: 'Eventos Prime',
      description: 'Nova unidade',
      role: 'OWNER',
    });

    renderShopSwitcher();

    const triggerButton = await screen.findByRole('button', {
      name: /atelier central/i,
    });
    await user.click(triggerButton);

    const addShopItem = await screen.findByRole('menuitem', {
      name: /adicionar loja/i,
    });
    await user.click(addShopItem);

    const nameInput = await screen.findByLabelText(/nome da loja/i);
    await user.type(nameInput, 'Eventos Prime');
    await user.click(screen.getByRole('button', { name: /criar loja/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /eventos prime/i })
      ).toBeInTheDocument();
    });

    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-3');
  });
});
