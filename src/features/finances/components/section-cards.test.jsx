import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SectionCards from './section-cards';

describe('SectionCards', () => {
  const mockBalance = {
    earnings: 12450,
    expenses: 3820,
    investiments: 45670,
    balance: 8630,
    earningsPercentage: 12.5,
    expensePercentage: -5.2,
    investmentsPercentage: 15,
  };

  it('renders default zero values and 0% badges when balance is not provided', () => {
    render(<SectionCards />);

    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('Despesas do Mês')).toBeInTheDocument();
    expect(screen.getByText('Investimentos Ativos')).toBeInTheDocument();
    expect(screen.getByText('Saldo Geral')).toBeInTheDocument();

    const zeroValues = screen.getAllByText('R$ 0,00');
    expect(zeroValues).toHaveLength(4);

    const zeroBadges = screen.getAllByText('0%');
    expect(zeroBadges).toHaveLength(4);
  });

  it('renders dynamic values, percentage badges, and upward/downward trend icons from balance prop', () => {
    render(<SectionCards balance={mockBalance} />);

    // Total Revenue (Receita Total)
    const revenueCard = screen.getByTestId('kpi-card-revenue');
    expect(within(revenueCard).getByText('Receita Total')).toBeInTheDocument();
    expect(within(revenueCard).getByText('R$ 12.450,00')).toBeInTheDocument();
    const revenueBadge = within(revenueCard).getByText('+12.5%').closest('[data-slot="badge"]');
    expect(revenueBadge).toBeInTheDocument();
    expect(revenueBadge.querySelector('svg')).toHaveClass('lucide-trending-up');

    // Period Expenses (Despesas do Mês)
    const expensesCard = screen.getByTestId('kpi-card-expenses');
    expect(within(expensesCard).getByText('Despesas do Mês')).toBeInTheDocument();
    expect(within(expensesCard).getByText('R$ 3.820,00')).toBeInTheDocument();
    const expenseBadge = within(expensesCard).getByText('-5.2%').closest('[data-slot="badge"]');
    expect(expenseBadge).toBeInTheDocument();
    expect(expenseBadge.querySelector('svg')).toHaveClass('lucide-trending-down');

    // Active Investments (Investimentos Ativos)
    const investmentsCard = screen.getByTestId('kpi-card-investments');
    expect(within(investmentsCard).getByText('Investimentos Ativos')).toBeInTheDocument();
    expect(within(investmentsCard).getByText('R$ 45.670,00')).toBeInTheDocument();
    const investmentsBadge = within(investmentsCard).getByText('+15%').closest('[data-slot="badge"]');
    expect(investmentsBadge).toBeInTheDocument();
    expect(investmentsBadge.querySelector('svg')).toHaveClass('lucide-trending-up');

    // Net Balance (Saldo Geral)
    // net margin = (8630 / 12450) * 100 = 69.317... => +69.3%
    const balanceCard = screen.getByTestId('kpi-card-balance');
    expect(within(balanceCard).getByText('Saldo Geral')).toBeInTheDocument();
    expect(within(balanceCard).getByText('R$ 8.630,00')).toBeInTheDocument();
    const balanceBadge = within(balanceCard).getByText('+69.3%').closest('[data-slot="badge"]');
    expect(balanceBadge).toBeInTheDocument();
    expect(balanceBadge.querySelector('svg')).toHaveClass('lucide-trending-up');
  });

  it('renders negative values, percentage drops, and downward trend icons properly', () => {
    const negativeBalance = {
      earnings: 5000,
      expenses: 8000,
      investiments: 1000,
      balance: -3000,
      earningsPercentage: -8.4,
      expensePercentage: 18.2,
      investmentsPercentage: -2.5,
    };

    render(<SectionCards balance={negativeBalance} />);

    // Receita Total drop
    const revenueCard = screen.getByTestId('kpi-card-revenue');
    const revenueBadge = within(revenueCard).getByText('-8.4%').closest('[data-slot="badge"]');
    expect(revenueBadge.querySelector('svg')).toHaveClass('lucide-trending-down');

    // Despesas do Mês rise
    const expensesCard = screen.getByTestId('kpi-card-expenses');
    const expenseBadge = within(expensesCard).getByText('+18.2%').closest('[data-slot="badge"]');
    expect(expenseBadge.querySelector('svg')).toHaveClass('lucide-trending-up');

    // Investimentos Ativos drop
    const investmentsCard = screen.getByTestId('kpi-card-investments');
    const investmentsBadge = within(investmentsCard).getByText('-2.5%').closest('[data-slot="badge"]');
    expect(investmentsBadge.querySelector('svg')).toHaveClass('lucide-trending-down');

    // Saldo Geral negative net margin = (-3000 / 5000) * 100 = -60%
    const balanceCard = screen.getByTestId('kpi-card-balance');
    const balanceBadge = within(balanceCard).getByText('-60%').closest('[data-slot="badge"]');
    expect(balanceBadge.querySelector('svg')).toHaveClass('lucide-trending-down');
  });

  it('handles zero earnings gracefully when computing net margin', () => {
    const zeroEarningsBalance = {
      earnings: 0,
      expenses: 500,
      investiments: 0,
      balance: -500,
      earningsPercentage: 0,
      expensePercentage: 0,
      investmentsPercentage: 0,
    };

    render(<SectionCards balance={zeroEarningsBalance} />);

    // Net margin with 0 earnings defaults to 0% and trending up icon (>= 0)
    const balanceCard = screen.getByTestId('kpi-card-balance');
    const balanceBadge = within(balanceCard).getByText('0%').closest('[data-slot="badge"]');
    expect(balanceBadge).toBeInTheDocument();
    expect(balanceBadge.querySelector('svg')).toHaveClass('lucide-trending-up');
  });

  it('renders accessible skeleton placeholders and avoids layout shifts when isLoading is true', () => {
    render(<SectionCards balance={mockBalance} isLoading={true} />);

    // Descriptions should still be present to retain layout structure
    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('Despesas do Mês')).toBeInTheDocument();
    expect(screen.getByText('Investimentos Ativos')).toBeInTheDocument();
    expect(screen.getByText('Saldo Geral')).toBeInTheDocument();

    // Values and percentage badges should be replaced by Skeletons
    expect(screen.queryByText('R$ 12.450,00')).not.toBeInTheDocument();
    expect(screen.queryByText('+12.5%')).not.toBeInTheDocument();
    expect(screen.queryByText('R$ 3.820,00')).not.toBeInTheDocument();
    expect(screen.queryByText('-5.2%')).not.toBeInTheDocument();
    expect(screen.queryByText('R$ 45.670,00')).not.toBeInTheDocument();
    expect(screen.queryByText('+15%')).not.toBeInTheDocument();
    expect(screen.queryByText('R$ 8.630,00')).not.toBeInTheDocument();
    expect(screen.queryByText('+69.3%')).not.toBeInTheDocument();

    // Skeletons are rendered (4 value skeletons + 4 badge skeletons = 8 skeletons)
    const skeletons = screen.getAllByTestId('kpi-skeleton');
    expect(skeletons).toHaveLength(8);

    // Accessible loading indicator
    expect(
      screen.getByRole('status', { name: /Carregando métricas financeiras/i })
    ).toBeInTheDocument();
  });
});
