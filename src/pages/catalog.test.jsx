import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { AppRoutes } from '@/main';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
  UNPROVIDED_SHOP_CONTEXT: Symbol('UNPROVIDED_SHOP_CONTEXT'),
}));

describe('Catalog Page Shell Integration', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockUser = {
    id: 'user-1',
    name: 'Ana Lojista',
    email: 'ana@festrack.com',
  };

  const mockShop = {
    id: 'shop-1',
    name: 'Festas Encantadas',
    role: 'OWNER',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthContext.mockReturnValue({
      user: mockUser,
      isInitializing: false,
      signout: vi.fn(),
    });

    useShopContext.mockReturnValue({
      shops: [mockShop],
      activeShop: mockShop,
      currentShop: mockShop,
      role: 'OWNER',
      isLoading: false,
      setActiveShop: vi.fn(),
    });
  });

  const renderCatalogPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <MemoryRouter initialEntries={['/catalog']}>
              <AppRoutes />
            </MemoryRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

  it('renders the catalog page shell inside DashboardLayout with hero banner, breadcrumbs, and sidebar item', () => {
    const { container } = renderCatalogPage();

    // 1. Verify Breadcrumbs in Header
    const breadcrumbNav = screen.getByRole('navigation', {
      name: /breadcrumb/i,
    });
    expect(breadcrumbNav).toBeInTheDocument();
    expect(within(breadcrumbNav).getByText('Festrack')).toBeInTheDocument();
    expect(within(breadcrumbNav).getByText('Catálogo')).toBeInTheDocument();

    // 2. Verify AppSidebar navigation contains "Catálogo" active link
    const sidebar = container.querySelector('[data-slot="sidebar"]');
    expect(sidebar).toBeInTheDocument();
    const catalogNavLink = within(sidebar).getByRole('link', {
      name: /catálogo/i,
    });
    expect(catalogNavLink).toBeInTheDocument();
    expect(catalogNavLink).toHaveAttribute('href', '/catalog');
    expect(catalogNavLink).toHaveAttribute('data-active');

    // 3. Verify Hero Banner Header within Catalog Page
    const heroTitle = screen.getByRole('heading', {
      name: 'Catálogo',
      level: 1,
    });
    expect(heroTitle).toBeInTheDocument();
    expect(
      screen.getByText('Gerencie produtos, pacotes virtuais e estoque da loja')
    ).toBeInTheDocument();
  });
});
