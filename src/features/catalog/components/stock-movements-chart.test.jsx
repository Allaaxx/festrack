import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import StockMovementsChart, {
  buildDailyStockChartData,
} from '@/features/catalog/components/stock-movements-chart';

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

describe('StockMovementsChart Component', () => {
  const sampleSeries = [
    {
      date: '2026-11-10',
      entradas: 20,
      saidas: 16,
    },
    {
      date: '2026-11-11',
      entradas: 15,
      saidas: 24,
    },
    {
      date: '2026-11-12',
      entradas: 25,
      saidas: 23,
    },
  ];

  it('renders with 3 months active by default and displays Fluxo de Estoque title and description', () => {
    render(<StockMovementsChart data={sampleSeries} />);

    expect(screen.getByText('Fluxo de Estoque')).toBeInTheDocument();
    expect(screen.getByText('Total dos últimos 3 meses')).toBeInTheDocument();

    const threeMonthsBtn = screen.getByRole('button', {
      name: 'Últimos 3 meses',
    });
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates selection and description when clicking Últimos 30 dias and Últimos 7 dias in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<StockMovementsChart />);

    const thirtyDaysBtn = screen.getByRole('button', {
      name: 'Últimos 30 dias',
    });
    await user.click(thirtyDaysBtn);

    expect(thirtyDaysBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 30 dias')).toBeInTheDocument();

    const sevenDaysBtn = screen.getByRole('button', {
      name: 'Últimos 7 dias',
    });
    await user.click(sevenDaysBtn);

    expect(sevenDaysBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 7 dias')).toBeInTheDocument();
  });

  it('does not deselect when clicking the currently active period button', async () => {
    const user = userEvent.setup();
    render(<StockMovementsChart />);

    const threeMonthsBtn = screen.getByRole('button', {
      name: 'Últimos 3 meses',
    });
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(threeMonthsBtn);
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 3 meses')).toBeInTheDocument();
  });

  it('calls onPeriodChange when a preset button is clicked and respects controlled period prop', async () => {
    const user = userEvent.setup();
    const handlePeriodChange = vi.fn();

    const { rerender } = render(
      <StockMovementsChart
        period="90d"
        onPeriodChange={handlePeriodChange}
      />
    );

    const thirtyDaysBtn = screen.getByRole('button', {
      name: 'Últimos 30 dias',
    });
    await user.click(thirtyDaysBtn);
    expect(handlePeriodChange).toHaveBeenCalledWith('30d');

    rerender(
      <StockMovementsChart
        period="7d"
        onPeriodChange={handlePeriodChange}
      />
    );

    const sevenDaysBtn = screen.getByRole('button', {
      name: 'Últimos 7 dias',
    });
    expect(sevenDaysBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 7 dias')).toBeInTheDocument();
  });

  it('renders dual areas for entradas and saidas with primary gradient defs', () => {
    const { container } = render(<StockMovementsChart data={sampleSeries} />);

    expect(container.querySelector('#fillEntradas')).toBeInTheDocument();
    expect(container.querySelector('#fillSaidas')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
    expect(screen.getByTestId('stock-movements-chart')).toBeInTheDocument();
  });

  it('renders loading skeleton state when isLoading is true', () => {
    const { container } = render(<StockMovementsChart isLoading={true} />);

    const card = screen.getByTestId('stock-movements-card');
    expect(card).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    expect(
      screen.getByText('Carregando gráfico de movimentações...')
    ).toBeInTheDocument();

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('builds daily series for 7d, 30d, and 90d from movements and products', () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const movements = [
      { id: '1', type: 'INBOUND', quantity: 12, date: todayStr },
      { id: '2', type: 'RENTAL_ALLOCATION', quantity: 5, date: todayStr },
      { id: '3', type: 'LOSS', quantity: 2, date: todayStr },
    ];

    const series7d = buildDailyStockChartData({
      movements,
      period: '7d',
    });
    expect(series7d).toHaveLength(7);

    const todayPoint = series7d.find((item) => item.date === todayStr);
    expect(todayPoint).toEqual({
      date: todayStr,
      entradas: 12,
      saidas: 7,
    });

    const series30d = buildDailyStockChartData({
      movements: [],
      period: '30d',
    });
    expect(series30d).toHaveLength(30);
  });
});
