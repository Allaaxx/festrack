import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CatalogMetrics from '@/features/catalog/components/catalog-metrics';

describe('CatalogMetrics Component', () => {
  const sampleMetrics = {
    activeCatalog: {
      total: 48,
      simpleProducts: 36,
      bundles: 12,
      trend: 12,
      trendLabel: 'vs. mês anterior',
    },
    activeRentals: {
      total: 26,
      trend: 8,
      trendLabel: 'unidades em eventos ativos',
    },
    stockAlerts: {
      total: 3,
      outOfStock: 2,
      criticalBottlenecks: 1,
      trend: -25,
      trendLabel: 'itens com reposição urgente',
    },
  };

  it('renders all three stat cards with their labels, values, and trend badges', () => {
    render(<CatalogMetrics metrics={sampleMetrics} />);

    // 1. Card: Catálogo Ativo
    const activeCatalogCard = screen.getByTestId('metric-card-active-catalog');
    expect(
      within(activeCatalogCard).getByText('Catálogo Ativo')
    ).toBeInTheDocument();
    expect(within(activeCatalogCard).getByText('48')).toBeInTheDocument();
    expect(within(activeCatalogCard).getByText('+12%')).toBeInTheDocument();
    expect(
      within(activeCatalogCard).getByText(
        /36 produtos simples, 12 pacotes virtuais/i
      )
    ).toBeInTheDocument();

    // 2. Card: Locações em Andamento
    const activeRentalsCard = screen.getByTestId('metric-card-active-rentals');
    expect(
      within(activeRentalsCard).getByText('Locações em Andamento')
    ).toBeInTheDocument();
    expect(within(activeRentalsCard).getByText('26')).toBeInTheDocument();
    expect(within(activeRentalsCard).getByText('+8%')).toBeInTheDocument();
    expect(
      within(activeRentalsCard).getByText(/unidades em eventos ativos/i)
    ).toBeInTheDocument();

    // 3. Card: Alertas de Estoque
    const stockAlertsCard = screen.getByTestId('metric-card-stock-alerts');
    expect(
      within(stockAlertsCard).getByText('Alertas de Estoque')
    ).toBeInTheDocument();
    expect(within(stockAlertsCard).getByText('3')).toBeInTheDocument();
    expect(within(stockAlertsCard).getByText('-25%')).toBeInTheDocument();
    expect(
      within(stockAlertsCard).getByText(/itens com reposição urgente/i)
    ).toBeInTheDocument();
  });

  it('renders loading skeleton state when isLoading is true', () => {
    const { container } = render(<CatalogMetrics isLoading={true} />);

    const metricsContainer = screen.getByTestId('catalog-metrics-grid');
    expect(metricsContainer).toHaveAttribute('aria-busy', 'true');
    expect(
      screen.getByText('Carregando indicadores do catálogo...')
    ).toBeInTheDocument();

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles zero or negative trend values correctly within respective cards', () => {
    const customMetrics = {
      activeCatalog: { total: 10, trend: -5 },
      activeRentals: { total: 0, trend: 0 },
      stockAlerts: { total: 0, trend: 0 },
    };

    render(<CatalogMetrics metrics={customMetrics} />);

    const activeCatalogCard = screen.getByTestId('metric-card-active-catalog');
    expect(within(activeCatalogCard).getByText('-5%')).toBeInTheDocument();

    const activeRentalsCard = screen.getByTestId('metric-card-active-rentals');
    expect(within(activeRentalsCard).getByText('0%')).toBeInTheDocument();

    const stockAlertsCard = screen.getByTestId('metric-card-stock-alerts');
    expect(within(stockAlertsCard).getByText('0%')).toBeInTheDocument();
  });

  it('renders default fixture values when metrics prop is omitted', () => {
    render(<CatalogMetrics />);

    expect(screen.getByText('Catálogo Ativo')).toBeInTheDocument();
    expect(screen.getByText('Locações em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Alertas de Estoque')).toBeInTheDocument();
  });
});
