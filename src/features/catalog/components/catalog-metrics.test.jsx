import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CatalogMetrics from '@/features/catalog/components/catalog-metrics';

describe('CatalogMetrics Component', () => {
  const sampleProducts = [
    {
      id: 'prod-1',
      name: 'Mesa Rústica 2m',
      type: 'rent',
      price: 150,
      is_bundle: false,
      stock: { quantity: 10, reserved: 4 }, // available = 6, value = 150 * 6 = 900
    },
    {
      id: 'prod-2',
      name: 'Vaso Espelhado',
      type: 'rent',
      price: 50,
      is_bundle: false,
      stock: { quantity: 3, reserved: 1 }, // available = 2 (low stock <= 3), value = 50 * 2 = 100
    },
    {
      id: 'prod-3',
      name: 'Vela Aromática',
      type: 'sale',
      price: 20,
      is_bundle: false,
      stock: { quantity: 2, reserved: 2 }, // available = 0 (out of stock), value = 20 * 0 = 0
    },
    {
      id: 'bundle-1',
      name: 'Kit Provençal Completo',
      type: 'rent',
      price: 400,
      is_bundle: true,
      bundle_items: [
        { product_id: 'prod-1', quantity: 2 }, // floor(6 / 2) = 3
        { product_id: 'prod-2', quantity: 1 }, // floor(2 / 1) = 2 -> bottleneck = 2 (low stock <= 3)
      ], // available = 2, value = 400 * 2 = 800
    },
  ];

  it('computes and renders all four KPI cards with two-line footers from live products', () => {
    render(<CatalogMetrics products={sampleProducts} />);

    const grid = screen.getByTestId('catalog-metrics-grid');
    expect(grid).toHaveClass('@xl/main:grid-cols-2', '@5xl/main:grid-cols-4');

    // 1. Total de Produtos: 4 total (3 simple + 1 bundle)
    const activeCatalogCard = screen.getByTestId('metric-card-active-catalog');
    expect(
      within(activeCatalogCard).getByText('Total de Produtos')
    ).toBeInTheDocument();
    expect(within(activeCatalogCard).getByText('4')).toBeInTheDocument();
    expect(
      within(activeCatalogCard).getByText('3 produtos simples e 1 pacotes')
    ).toBeInTheDocument();
    expect(
      within(activeCatalogCard).getByText(
        'Itens cadastrados no catálogo da loja'
      )
    ).toBeInTheDocument();

    // 2. Valor do Catálogo: 900 + 100 + 0 + 800 = R$ 1.800,00
    const catalogValueCard = screen.getByTestId('metric-card-catalog-value');
    expect(
      within(catalogValueCard).getByText('Valor do Catálogo')
    ).toBeInTheDocument();
    expect(
      within(catalogValueCard).getByText('R$ 1.800,00')
    ).toBeInTheDocument();
    expect(
      within(catalogValueCard).getByText('Potencial financeiro ativo')
    ).toBeInTheDocument();
    expect(
      within(catalogValueCard).getByText(
        'Baseado no estoque e preços unitários'
      )
    ).toBeInTheDocument();

    // 3. Unidades Disponíveis: 6 + 2 + 0 = 8 available, 4 + 1 + 2 = 7 reserved
    const activeRentalsCard = screen.getByTestId('metric-card-active-rentals');
    expect(
      within(activeRentalsCard).getByText('Unidades Disponíveis')
    ).toBeInTheDocument();
    expect(within(activeRentalsCard).getByText('8')).toBeInTheDocument();
    expect(
      within(activeRentalsCard).getByText('7 unidades reservadas em eventos')
    ).toBeInTheDocument();
    expect(
      within(activeRentalsCard).getByText(
        'Prontas para locação ou venda imediata'
      )
    ).toBeInTheDocument();

    // 4. Alertas de Estoque: prod-2 (avail 2), prod-3 (avail 0), bundle-1 (avail 2) => 3 alerts
    const stockAlertsCard = screen.getByTestId('metric-card-stock-alerts');
    expect(
      within(stockAlertsCard).getByText('Alertas de Estoque')
    ).toBeInTheDocument();
    expect(within(stockAlertsCard).getByText('3')).toBeInTheDocument();
    expect(
      within(stockAlertsCard).getByText('Atenção à reposição de itens')
    ).toBeInTheDocument();
    expect(
      within(stockAlertsCard).getByText(
        'Produtos esgotados ou pacotes com gargalo'
      )
    ).toBeInTheDocument();
  });

  it('supports rendering from metrics prop with trend badges', () => {
    const sampleMetrics = {
      activeCatalog: {
        total: 48,
        simpleProducts: 36,
        bundles: 12,
        trend: 12,
      },
      catalogValue: {
        total: 15400,
        trend: 5.5,
      },
      activeRentals: {
        total: 26,
        reserved: 14,
        trend: 8,
      },
      stockAlerts: {
        total: 3,
        trend: -25,
      },
    };

    render(<CatalogMetrics metrics={sampleMetrics} />);

    const activeCatalogCard = screen.getByTestId('metric-card-active-catalog');
    expect(within(activeCatalogCard).getByText('48')).toBeInTheDocument();
    expect(within(activeCatalogCard).getByText('+12%')).toBeInTheDocument();
    expect(
      within(activeCatalogCard).getByText('36 produtos simples e 12 pacotes')
    ).toBeInTheDocument();

    const catalogValueCard = screen.getByTestId('metric-card-catalog-value');
    expect(
      within(catalogValueCard).getByText('R$ 15.400,00')
    ).toBeInTheDocument();
    expect(within(catalogValueCard).getByText('+5.5%')).toBeInTheDocument();

    const activeRentalsCard = screen.getByTestId('metric-card-active-rentals');
    expect(within(activeRentalsCard).getByText('26')).toBeInTheDocument();
    expect(within(activeRentalsCard).getByText('+8%')).toBeInTheDocument();
    expect(
      within(activeRentalsCard).getByText('14 unidades reservadas em eventos')
    ).toBeInTheDocument();

    const stockAlertsCard = screen.getByTestId('metric-card-stock-alerts');
    expect(within(stockAlertsCard).getByText('3')).toBeInTheDocument();
    expect(within(stockAlertsCard).getByText('-25%')).toBeInTheDocument();
  });

  it('renders loading skeleton state when isLoading is true', () => {
    const { container } = render(<CatalogMetrics isLoading={true} />);

    const metricsContainer = screen.getByTestId('catalog-metrics-grid');
    expect(metricsContainer).toHaveAttribute('aria-busy', 'true');
    expect(
      screen.getByText('Carregando indicadores do catálogo...')
    ).toBeInTheDocument();

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons).toHaveLength(8);
  });

  it('renders zero values and healthy stock message when no products or metrics are provided', () => {
    render(<CatalogMetrics />);

    expect(screen.getByText('Total de Produtos')).toBeInTheDocument();
    expect(screen.getByText('Valor do Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Unidades Disponíveis')).toBeInTheDocument();
    expect(screen.getByText('Alertas de Estoque')).toBeInTheDocument();

    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    expect(
      screen.getByText('Estoque operando normalmente')
    ).toBeInTheDocument();
  });
});
