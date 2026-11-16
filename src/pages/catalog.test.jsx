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
import { CatalogService, ProductService } from '@/features/catalog';
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

describe('Catalog Page Shell Integration (#124)', () => {
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

  const tableProduct = {
    id: 'prod-table',
    name: 'Mesa Rústica Retangular 2m',
    slug: 'mesa-rustica-retangular-2m',
    description: 'Mesa em madeira maciça para eventos',
    type: 'rent',
    price: 150,
    images: ['https://example.com/mesa.jpg'],
    is_bundle: false,
    stock: { quantity: 10, reserved: 2 }, // available = 8
  };

  const balloonProduct = {
    id: 'prod-balloon',
    name: 'Arco Orgânico de Balões',
    slug: 'arco-organico-baloes',
    description: 'Balões metalizados rose gold',
    type: 'sale',
    price: 180,
    images: [],
    is_bundle: false,
    stock: { quantity: 6, reserved: 4 }, // available = 2 (low stock <= 3)
  };

  const outOfStockProduct = {
    id: 'prod-out',
    name: 'Toalha Jacquard Dourada',
    slug: 'toalha-jacquard-dourada',
    description: 'Tecido nobre para mesas',
    type: 'rent',
    price: 50,
    images: [],
    is_bundle: false,
    stock: { quantity: 5, reserved: 5 }, // available = 0 (out of stock)
  };

  const bundleProduct = {
    id: 'bundle-1',
    name: 'Kit Festa Infantil Provençal Encantada',
    slug: 'kit-festa-infantil-provencal',
    description: 'Pacote completo com mesa e balões',
    type: 'rent',
    price: 380,
    images: [],
    is_bundle: true,
    stock: null,
    bundle_items: [
      {
        id: 'bi-1',
        product_id: 'prod-table',
        quantity: 1, // 8 / 1 = 8
        componentProduct: tableProduct,
      },
      {
        id: 'bi-2',
        product_id: 'prod-balloon',
        quantity: 1, // 2 / 1 = 2 (bottleneck = 2 <= 3)
        componentProduct: balloonProduct,
      },
    ],
  };

  const mockProducts = [
    tableProduct,
    balloonProduct,
    outOfStockProduct,
    bundleProduct,
  ];

  const mockMetrics = {
    activeCatalog: {
      total: 4,
      simpleProducts: 3,
      bundles: 1,
      trend: 15,
    },
    catalogValue: {
      total: 2370,
      trend: 8,
    },
    activeRentals: {
      total: 10,
      reserved: 11,
      trend: 10,
    },
    stockAlerts: {
      total: 3,
      outOfStock: 1,
      criticalBottlenecks: 2,
      trend: -20,
    },
  };

  const mockMovements = {
    movements: [
      {
        id: 'mov-1',
        type: 'INBOUND',
        productId: 'prod-table',
        productName: 'Mesa Rústica Retangular 2m',
        quantity: 10,
        date: '2026-11-12T10:00:00.000Z',
        note: 'Recebimento de lote novo',
      },
      {
        id: 'mov-2',
        type: 'RENTAL_ALLOCATION',
        productId: 'prod-table',
        productName: 'Mesa Rústica Retangular 2m',
        quantity: 2,
        date: '2026-11-11T14:30:00.000Z',
        note: 'Reserva para Casamento Marina',
      },
    ],
    series: [
      {
        date: '2026-11-10',
        entradas: 30,
        saidas: 10,
      },
      {
        date: '2026-11-11',
        entradas: 20,
        saidas: 12,
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

    vi.spyOn(ProductService, 'getAll').mockResolvedValue(mockProducts);
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

  it('renders the 4 sections in exact order inside DashboardLayout and omits obsolete CatalogHeader and RentalCheckinCard', async () => {
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

    // 3. Verify obsolete CatalogHeader and RentalCheckinCard are NOT rendered
    expect(
      screen.queryByRole('heading', { name: 'Catálogo', level: 1 })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/gerencie produtos, pacotes virtuais/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('rental-checkin-card')).not.toBeInTheDocument();
    expect(screen.queryByText('Controle de Locações')).not.toBeInTheDocument();

    // 4. Verify the 4 sections exist and appear in exact DOM order
    const metricsSection = await screen.findByTestId('catalog-metrics-grid');
    const chartSection = screen.getByTestId('stock-movements-card');
    const operationalGridSection = screen.getByTestId(
      'catalog-operational-grid'
    );
    const tableSection = screen.getByTestId('catalog-table-section');

    expect(
      metricsSection.compareDocumentPosition(chartSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      chartSection.compareDocumentPosition(operationalGridSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      operationalGridSection.compareDocumentPosition(tableSection) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // Verify the 3 operational cards inside CatalogOperationalGrid
    expect(
      within(operationalGridSection).getByTestId('shop-distribution-card')
    ).toBeInTheDocument();
    expect(
      within(operationalGridSection).getByTestId(
        'stock-movements-timeline-card'
      )
    ).toBeInTheDocument();
    expect(
      within(operationalGridSection).getByTestId('popular-products-card')
    ).toBeInTheDocument();
  });

  it('renders live KPI cards, interactive area chart, operational 3-card grid, and product table with real data and canonical "Pacote" terminology', async () => {
    renderCatalogPage();

    await waitFor(() => {
      expect(ProductService.getAll).toHaveBeenCalledWith({
        shopId: 'shop-1',
        type: undefined,
      });
      expect(CatalogService.getMetrics).toHaveBeenCalledWith({
        shopId: 'shop-1',
      });
      expect(CatalogService.getStockMovements).toHaveBeenCalledWith({
        shopId: 'shop-1',
        from: undefined,
        to: undefined,
        period: undefined,
      });
    });

    // Section 1: KPI Cards computed from products + metrics trends
    await waitFor(() => {
      const activeCatalogCard = screen.getByTestId(
        'metric-card-active-catalog'
      );
      expect(
        within(activeCatalogCard).getByText('Total de Produtos')
      ).toBeInTheDocument();
      expect(within(activeCatalogCard).getByText('4')).toBeInTheDocument();
      expect(
        within(activeCatalogCard).getByText('3 produtos simples e 1 pacotes')
      ).toBeInTheDocument();
    });

    const catalogValueCard = screen.getByTestId('metric-card-catalog-value');
    expect(
      within(catalogValueCard).getByText('Valor do Catálogo')
    ).toBeInTheDocument();

    const availableUnitsCard = screen.getByTestId('metric-card-active-rentals');
    expect(
      within(availableUnitsCard).getByText('Unidades Disponíveis')
    ).toBeInTheDocument();
    expect(within(availableUnitsCard).getByText('10')).toBeInTheDocument();
    expect(
      within(availableUnitsCard).getByText('11 unidades reservadas em eventos')
    ).toBeInTheDocument();

    const stockAlertsCard = screen.getByTestId('metric-card-stock-alerts');
    expect(
      within(stockAlertsCard).getByText('Alertas de Estoque')
    ).toBeInTheDocument();
    expect(within(stockAlertsCard).getByText('3')).toBeInTheDocument();

    // Section 2: Interactive Area Chart
    const movementsCard = screen.getByTestId('stock-movements-card');
    expect(
      within(movementsCard).getByText('Fluxo de Estoque')
    ).toBeInTheDocument();
    expect(
      within(movementsCard).getByRole('button', { name: 'Últimos 3 meses' })
    ).toBeInTheDocument();

    // Section 3: 3-Card Operational Grid
    const distributionCard = screen.getByTestId('shop-distribution-card');
    expect(
      within(distributionCard).getByText('Festas Encantadas')
    ).toBeInTheDocument();
    expect(
      within(distributionCard).getByRole('tab', { name: /aluguel/i })
    ).toBeInTheDocument();
    expect(
      within(distributionCard).getByRole('tab', { name: /venda/i })
    ).toBeInTheDocument();
    expect(
      within(distributionCard).getByRole('tab', { name: /^pacote$/i })
    ).toBeInTheDocument();

    const timelineCard = screen.getByTestId('stock-movements-timeline-card');
    expect(
      within(timelineCard).getByText('Movimentações de Estoque')
    ).toBeInTheDocument();
    expect(
      within(timelineCard).getByText('2 movimentações registradas')
    ).toBeInTheDocument();

    const popularCard = screen.getByTestId('popular-products-card');
    expect(
      within(popularCard).getByText('Produtos Populares')
    ).toBeInTheDocument();
    expect(
      within(popularCard).getByText('Total de 4 itens no catálogo')
    ).toBeInTheDocument();

    // Section 4: Product Table
    const tableSection = screen.getByTestId('catalog-table-section');
    expect(
      await within(tableSection).findByText('Mesa Rústica Retangular 2m')
    ).toBeInTheDocument();
    expect(
      within(tableSection).getByText('Kit Festa Infantil Provençal Encantada')
    ).toBeInTheDocument();

    // Canonical "Pacote" terminology verified across the page
    expect(within(tableSection).getByText('Pacote')).toBeInTheDocument();
    expect(screen.queryByText(/pacote virtual/i)).not.toBeInTheDocument();
  });

  it('displays loading skeletons across all 4 sections while queries are pending', () => {
    ProductService.getAll.mockReturnValue(new Promise(() => {}));
    CatalogService.getMetrics.mockReturnValue(new Promise(() => {}));
    CatalogService.getStockMovements.mockReturnValue(new Promise(() => {}));

    renderCatalogPage();

    // Section 1: KPI skeletons
    expect(screen.getAllByTestId('kpi-skeleton').length).toBeGreaterThan(0);

    // Section 2: Chart loading skeleton
    expect(screen.getByTestId('chart-loading')).toBeInTheDocument();

    // Section 3: Operational grid skeletons
    expect(
      screen.getAllByTestId('operational-grid-skeleton').length
    ).toBeGreaterThanOrEqual(3);

    // Section 4: Table loading indicator
    expect(screen.getByTestId('catalog-loading')).toBeInTheDocument();
  });

  it('displays friendly empty states when the active shop has no products yet', async () => {
    ProductService.getAll.mockResolvedValue([]);
    CatalogService.getMetrics.mockResolvedValue({
      activeCatalog: { total: 0, simpleProducts: 0, bundles: 0, trend: 0 },
      activeRentals: { total: 0, trend: 0 },
      stockAlerts: {
        total: 0,
        outOfStock: 0,
        criticalBottlenecks: 0,
        trend: 0,
      },
    });
    CatalogService.getStockMovements.mockResolvedValue({
      movements: [],
      series: [],
    });

    renderCatalogPage();

    // Wait for loading to complete and empty states to appear
    expect(
      await screen.findByText('Nenhum produto encontrado')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nenhum produto cadastrado na loja.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nenhuma movimentação registrada nesta categoria.')
    ).toBeInTheDocument();

    const activeCatalogCard = screen.getByTestId('metric-card-active-catalog');
    expect(within(activeCatalogCard).getByText('0')).toBeInTheDocument();
  });

  it('displays error state and retries loading products when ProductService.getAll fails', async () => {
    const user = userEvent.setup();
    ProductService.getAll.mockRejectedValueOnce(new Error('Falha de rede'));

    renderCatalogPage();

    const errorRow = await screen.findByTestId('catalog-error');
    expect(errorRow).toBeInTheDocument();
    expect(
      within(errorRow).getByText('Erro ao carregar o catálogo')
    ).toBeInTheDocument();

    ProductService.getAll.mockResolvedValueOnce(mockProducts);

    const retryBtn = within(errorRow).getByRole('button', {
      name: /tentar novamente/i,
    });
    await user.click(retryBtn);

    const tableSection = screen.getByTestId('catalog-table-section');
    expect(
      await within(tableSection).findByText('Mesa Rústica Retangular 2m')
    ).toBeInTheDocument();
  });

  it('filters table products by search, category select, and stock status select, and opens "+ Adicionar produto" modal', async () => {
    const user = userEvent.setup();
    renderCatalogPage();

    const tableSection = await screen.findByTestId('catalog-table-section');
    expect(
      await within(tableSection).findByText('Mesa Rústica Retangular 2m')
    ).toBeInTheDocument();
    expect(
      within(tableSection).getByText('Arco Orgânico de Balões')
    ).toBeInTheDocument();
    expect(
      within(tableSection).getByText('Toalha Jacquard Dourada')
    ).toBeInTheDocument();
    expect(
      within(tableSection).getByText('Kit Festa Infantil Provençal Encantada')
    ).toBeInTheDocument();

    // 1. Search filter
    const searchInput = within(tableSection).getByPlaceholderText(
      /buscar produtos por nome/i
    );
    await user.type(searchInput, 'Mesa Rústica');

    expect(
      within(tableSection).getByText('Mesa Rústica Retangular 2m')
    ).toBeInTheDocument();
    expect(
      within(tableSection).queryByText('Arco Orgânico de Balões')
    ).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(
      within(tableSection).getByText('Arco Orgânico de Balões')
    ).toBeInTheDocument();

    // 2. Category filter -> "Pacote"
    const categoryTrigger = within(tableSection).getByRole('combobox', {
      name: /filtrar por categoria/i,
    });
    await user.click(categoryTrigger);
    await user.click(await screen.findByRole('option', { name: /^pacote$/i }));

    expect(
      within(tableSection).getByText('Kit Festa Infantil Provençal Encantada')
    ).toBeInTheDocument();
    expect(
      within(tableSection).queryByText('Mesa Rústica Retangular 2m')
    ).not.toBeInTheDocument();

    // Reset category filter -> "Todos"
    await user.click(categoryTrigger);
    await user.click(await screen.findByRole('option', { name: /^todos$/i }));

    // 3. Stock status filter -> "Esgotado"
    const stockStatusTrigger = within(tableSection).getByRole('combobox', {
      name: /filtrar por status de estoque/i,
    });
    await user.click(stockStatusTrigger);
    await user.click(
      await screen.findByRole('option', { name: /^esgotado$/i })
    );

    expect(
      within(tableSection).getByText('Toalha Jacquard Dourada')
    ).toBeInTheDocument();
    expect(
      within(tableSection).queryByText('Mesa Rústica Retangular 2m')
    ).not.toBeInTheDocument();

    // 4. Open "+ Adicionar produto" modal from table toolbar
    const addProductBtn = within(tableSection).getByRole('button', {
      name: /adicionar produto/i,
    });
    await user.click(addProductBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: /novo produto/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('tab', { name: /produto simples/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('tab', { name: /^pacote$/i })
    ).toBeInTheDocument();
  }, 15000);
});
