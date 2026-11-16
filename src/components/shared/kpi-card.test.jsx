import { render, screen, within } from '@testing-library/react';
import { TrendingUpIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('renders title, formatted value, trend badge with icon, and two-line footer', () => {
    render(
      <KpiCard
        testId="kpi-card-revenue"
        title="Receita Total"
        value="R$ 12.450,00"
        badgeText="+12.5%"
        badgeIcon={<TrendingUpIcon />}
        footerTitle="Crescimento este mês"
        footerIcon={<TrendingUpIcon className="size-4" />}
        footerSubtitle="Comparado aos últimos 6 meses"
      />
    );

    const card = screen.getByTestId('kpi-card-revenue');
    expect(within(card).getByText('Receita Total')).toBeInTheDocument();
    expect(within(card).getByText('R$ 12.450,00')).toBeInTheDocument();

    const badge = within(card).getByText('+12.5%').closest('[data-slot="badge"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-variant', 'outline');
    expect(badge.querySelector('svg')).toHaveClass('lucide-trending-up');

    expect(within(card).getByText('Crescimento este mês')).toBeInTheDocument();
    expect(
      within(card).getByText('Comparado aos últimos 6 meses')
    ).toBeInTheDocument();
  });

  it('replaces value and badge with skeletons when isLoading is true while keeping title and footer', () => {
    render(
      <KpiCard
        testId="kpi-card-revenue"
        title="Receita Total"
        value="R$ 12.450,00"
        badgeText="+12.5%"
        badgeIcon={<TrendingUpIcon />}
        footerTitle="Crescimento este mês"
        footerIcon={<TrendingUpIcon className="size-4" />}
        footerSubtitle="Comparado aos últimos 6 meses"
        isLoading={true}
      />
    );

    const card = screen.getByTestId('kpi-card-revenue');
    expect(within(card).getByText('Receita Total')).toBeInTheDocument();
    expect(within(card).getByText('Crescimento este mês')).toBeInTheDocument();
    expect(
      within(card).getByText('Comparado aos últimos 6 meses')
    ).toBeInTheDocument();

    expect(within(card).queryByText('R$ 12.450,00')).not.toBeInTheDocument();
    expect(within(card).queryByText('+12.5%')).not.toBeInTheDocument();

    const skeletons = within(card).getAllByTestId('kpi-skeleton');
    expect(skeletons).toHaveLength(2);
    expect(skeletons[0]).toHaveAttribute('aria-hidden', 'true');
    expect(skeletons[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports custom badgeVariant and data-testid attribute', () => {
    render(
      <KpiCard
        data-testid="metric-card-stock-alerts"
        title="Alertas de Estoque"
        value={3}
        badgeText="Atenção"
        badgeVariant="destructive"
        footerTitle="Itens com estoque crítico"
        footerSubtitle="Verifique reposição imediata"
      />
    );

    const card = screen.getByTestId('metric-card-stock-alerts');
    const badge = within(card).getByText('Atenção').closest('[data-slot="badge"]');
    expect(badge).toHaveAttribute('data-variant', 'destructive');
  });
});
