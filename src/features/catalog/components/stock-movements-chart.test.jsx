import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import StockMovementsChart from '@/features/catalog/components/stock-movements-chart';

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
      day: 'Ter',
      inbound: 20,
      sale: 5,
      rentalAllocation: 10,
      loss: 1,
    },
    {
      date: '2026-11-11',
      day: 'Qua',
      inbound: 15,
      sale: 10,
      rentalAllocation: 12,
      loss: 2,
    },
    {
      date: '2026-11-12',
      day: 'Qui',
      inbound: 25,
      sale: 8,
      rentalAllocation: 15,
      loss: 0,
    },
  ];

  it('renders the chart card header, title, and subtitle', () => {
    render(<StockMovementsChart data={sampleSeries} />);

    expect(screen.getByText('Movimentações de Estoque')).toBeInTheDocument();
    expect(
      screen.getByText('Fluxo operacional semanal de itens')
    ).toBeInTheDocument();
  });

  it('calculates and renders summary indicators for all movement types', () => {
    render(<StockMovementsChart data={sampleSeries} />);

    // Total Inbound: 20 + 15 + 25 = 60
    // Total Sale: 5 + 10 + 8 = 23
    // Total Rental: 10 + 12 + 15 = 37
    // Total Loss: 1 + 2 + 0 = 3

    expect(screen.getByTestId('summary-inbound')).toHaveTextContent('60 un');
    expect(screen.getByTestId('summary-sale')).toHaveTextContent('23 un');
    expect(screen.getByTestId('summary-rental')).toHaveTextContent('37 un');
    expect(screen.getByTestId('summary-loss')).toHaveTextContent('3 un');
  });

  it('renders period filter buttons and allows switching preset', async () => {
    const user = userEvent.setup();
    const handlePeriodChange = vi.fn();

    render(
      <StockMovementsChart
        data={sampleSeries}
        onPeriodChange={handlePeriodChange}
      />
    );

    const thirtyDaysBtn = screen.getByRole('button', {
      name: /30 dias/i,
    });
    expect(thirtyDaysBtn).toBeInTheDocument();

    await user.click(thirtyDaysBtn);
    expect(handlePeriodChange).toHaveBeenCalledWith('30d');
  });

  it('renders loading skeleton state when isLoading is true', () => {
    const { container } = render(<StockMovementsChart isLoading={true} />);

    const card = screen.getByTestId('stock-movements-card');
    expect(card).toHaveAttribute('aria-busy', 'true');
    expect(
      screen.getByText('Carregando gráfico de movimentações...')
    ).toBeInTheDocument();

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders with default fixture data when data prop is omitted', () => {
    render(<StockMovementsChart />);

    expect(screen.getByText('Movimentações de Estoque')).toBeInTheDocument();
    expect(screen.getByTestId('stock-movements-chart')).toBeInTheDocument();
  });
});
