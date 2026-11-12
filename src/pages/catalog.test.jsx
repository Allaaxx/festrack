import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { CatalogService } from '@/features/catalog/api/services';
import { AppRoutes } from '@/main';

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

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
  UNPROVIDED_SHOP_CONTEXT: Symbol('UNPROVIDED_SHOP_CONTEXT'),
}));

vi.mock('@/features/catalog/api/services', () => ({
  CatalogService: {
    getMetrics: vi.fn(),
    getStockMovements: vi.fn(),
  },
}));

describe('Catalog Page Shell Integration', () => {
  let queryClient;

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

  const mockMetrics = {
    activeCatalog: {
      total: 52,
      simpleProducts: 40,
      bundles: 12,
      trend: 15,
      trendLabel: 'vs. mês anterior',
    },
    activeRentals: {
      total: 28,
      trend: 10,
      trendLabel: 'unidades em eventos ativos',
    },
    stockAlerts: {
      total: 2,
      outOfStock: 1,
      criticalBottlenecks: 1,
      trend: -50,
      trendLabel: 'itens com reposição urgente',
    },
  };

  const mockMovements = {
    movements: [],
    series: [
      {
        date: '2026-11-10',
        day: 'Ter',
        inbound: 30,
        sale: 10,
        rentalAllocation: 15,
        loss: 1,
      },
      {
        date: '2026-11-11',
        day: 'Qua',
        inbound: 20,
        sale: 8,
        rentalAllocation: 12,
        loss: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

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

    CatalogService.getMetrics.mockResolvedValue(mockMetrics);
    CatalogService.getStockMovements.mockResolvedValue(mockMovements);
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

  it('renders catalog health metrics cards with values and trends fetched from API', async () => {
    renderCatalogPage();

    await waitFor(() => {
      expect(CatalogService.getMetrics).toHaveBeenCalledWith({
        shopId: 'shop-1',
      });
    });

    // Catálogo Ativo
    await waitFor(() => {
      const activeCatalogCard = screen.getByTestId(
        'metric-card-active-catalog'
      );
      expect(
        within(activeCatalogCard).getByText('Catálogo Ativo')
      ).toBeInTheDocument();
      expect(within(activeCatalogCard).getByText('52')).toBeInTheDocument();
      expect(within(activeCatalogCard).getByText('+15%')).toBeInTheDocument();
    });

    // Locações em Andamento
    const activeRentalsCard = screen.getByTestId('metric-card-active-rentals');
    expect(
      within(activeRentalsCard).getByText('Locações em Andamento')
    ).toBeInTheDocument();
    expect(within(activeRentalsCard).getByText('28')).toBeInTheDocument();
    expect(within(activeRentalsCard).getByText('+10%')).toBeInTheDocument();

    // Alertas de Estoque
    const stockAlertsCard = screen.getByTestId('metric-card-stock-alerts');
    expect(
      within(stockAlertsCard).getByText('Alertas de Estoque')
    ).toBeInTheDocument();
    expect(within(stockAlertsCard).getByText('2')).toBeInTheDocument();
    expect(within(stockAlertsCard).getByText('-50%')).toBeInTheDocument();
  });

  it('renders the interactive stock movements chart with summary indicators', async () => {
    renderCatalogPage();

    await waitFor(() => {
      expect(CatalogService.getStockMovements).toHaveBeenCalledWith({
        shopId: 'shop-1',
      });
    });

    const movementsCard = screen.getByTestId('stock-movements-card');
    expect(
      within(movementsCard).getByText('Movimentações de Estoque')
    ).toBeInTheDocument();
    expect(
      within(movementsCard).getByText('Fluxo operacional semanal de itens')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        within(movementsCard).getByTestId('summary-inbound')
      ).toHaveTextContent('50 un');
      expect(
        within(movementsCard).getByTestId('summary-sale')
      ).toHaveTextContent('18 un');
      expect(
        within(movementsCard).getByTestId('summary-rental')
      ).toHaveTextContent('27 un');
      expect(
        within(movementsCard).getByTestId('summary-loss')
      ).toHaveTextContent('1 un');
    });
  });

  it('renders the rental check-in logistics card with timeline tracking and return progress', async () => {
    renderCatalogPage();

    const rentalsCard = screen.getByTestId('rental-checkin-card');
    expect(rentalsCard).toBeInTheDocument();

    expect(
      within(rentalsCard).getByText('Controle de Locações')
    ).toBeInTheDocument();
    expect(
      within(rentalsCard).getByText(
        'Acompanhe entregas, retiradas e devoluções para eventos'
      )
    ).toBeInTheDocument();

    expect(
      within(rentalsCard).getByRole('tab', { name: /retorno pendente/i })
    ).toBeInTheDocument();
    expect(
      within(rentalsCard).getByRole('tab', { name: /em evento/i })
    ).toBeInTheDocument();
    expect(
      within(rentalsCard).getByRole('tab', { name: /reservados/i })
    ).toBeInTheDocument();
    expect(
      within(rentalsCard).getByRole('tab', { name: /inspecionados/i })
    ).toBeInTheDocument();

    // Verify timeline items rendered after query resolution
    await waitFor(() => {
      expect(
        within(rentalsCard).getByText(/Mariana Souza/i)
      ).toBeInTheDocument();
      expect(
        within(rentalsCard).getByRole('button', { name: /registrar check-in/i })
      ).toBeInTheDocument();
    });
  });

  it('renders the catalog data table with search, classification tabs, and product directory', async () => {
    renderCatalogPage();

    // 1. Search bar and filter tabs rendered
    expect(
      screen.getByPlaceholderText(/buscar produtos por nome/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /venda/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aluguel/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /serviço/i })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /pacote virtual/i })
    ).toBeInTheDocument();

    // 2. Table columns rendered
    expect(
      screen.getByRole('columnheader', { name: /produto/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /classificação/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /preço/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /estoque/i })
    ).toBeInTheDocument();

    // 3. Products rendered in table
    expect(
      await screen.findByText('Mesa Rústica Retangular 2m')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Kit Festa Infantil Provençal Encantada')
    ).toBeInTheDocument();
  });

  it('opens the CreateProductDialog when clicking the "Novo Produto" header button', async () => {
    const user = userEvent.setup();
    renderCatalogPage();

    const newProductBtn = screen.getByRole('button', {
      name: /novo produto/i,
    });
    expect(newProductBtn).toBeInTheDocument();

    await user.click(newProductBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: /novo produto/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('tab', { name: /produto simples/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('tab', { name: /pacote virtual/i })
    ).toBeInTheDocument();
  });
});
