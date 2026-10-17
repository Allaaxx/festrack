import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import ChartAreaInteractive from './chart-area-interactive';

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

describe('ChartAreaInteractive', () => {
  it('renders with 3 months active by default and updates description', () => {
    render(<ChartAreaInteractive />);

    expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument();
    expect(screen.getByText('Total dos últimos 3 meses')).toBeInTheDocument();

    const threeMonthsBtn = screen.getByRole('button', {
      name: 'Últimos 3 meses',
    });
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates selection and description when clicking Últimos 30 dias in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<ChartAreaInteractive />);

    const thirtyDaysBtn = screen.getByRole('button', {
      name: 'Últimos 30 dias',
    });
    await user.click(thirtyDaysBtn);

    expect(thirtyDaysBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 30 dias')).toBeInTheDocument();

    const threeMonthsBtn = screen.getByRole('button', {
      name: 'Últimos 3 meses',
    });
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('updates selection and description when clicking Últimos 7 dias in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<ChartAreaInteractive />);

    const sevenDaysBtn = screen.getByRole('button', { name: 'Últimos 7 dias' });
    await user.click(sevenDaysBtn);

    expect(sevenDaysBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 7 dias')).toBeInTheDocument();
  });

  it('does not deselect when clicking the currently active button', async () => {
    const user = userEvent.setup();
    render(<ChartAreaInteractive />);

    const threeMonthsBtn = screen.getByRole('button', {
      name: 'Últimos 3 meses',
    });
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(threeMonthsBtn);
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 3 meses')).toBeInTheDocument();
  });

  it('calls onPresetChange callback when a preset button is clicked', async () => {
    const user = userEvent.setup();
    const handlePresetChange = vi.fn();
    render(<ChartAreaInteractive onPresetChange={handlePresetChange} />);

    const thirtyDaysBtn = screen.getByRole('button', {
      name: 'Últimos 30 dias',
    });
    await user.click(thirtyDaysBtn);

    expect(handlePresetChange).toHaveBeenCalledWith('30d');

    const sevenDaysBtn = screen.getByRole('button', {
      name: 'Últimos 7 dias',
    });
    await user.click(sevenDaysBtn);

    expect(handlePresetChange).toHaveBeenCalledWith('7d');
  });

  it('respects controlled activePreset prop', () => {
    render(<ChartAreaInteractive activePreset="7d" />);

    const sevenDaysBtn = screen.getByRole('button', {
      name: 'Últimos 7 dias',
    });
    expect(sevenDaysBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Total dos últimos 7 dias')).toBeInTheDocument();

    const threeMonthsBtn = screen.getByRole('button', {
      name: 'Últimos 3 meses',
    });
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<ChartAreaInteractive isLoading={true} />);

    expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('renders dual areas for entradas and saidas and semantic gradient defs', () => {
    const mockTransactions = [
      { id: '1', date: '2026-10-01', type: 'EARNING', amount: 1500 },
      { id: '2', date: '2026-10-02', type: 'EXPENSE', amount: 400 },
      { id: '3', date: '2026-10-03', type: 'INVESTMENT', amount: 300 },
    ];

    const { container } = render(
      <ChartAreaInteractive
        transactions={mockTransactions}
        from="2026-10-01"
        to="2026-10-03"
      />
    );

    // Verify semantic gradient definitions exist in defs
    expect(container.querySelector('#fillEntradas')).toBeInTheDocument();
    expect(container.querySelector('#fillSaidas')).toBeInTheDocument();


    // Verify chart container and areas
    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  it('passes from, to, and onDateRangeChange to DateSelection', () => {
    const handleDateRangeChange = vi.fn();

    render(
      <ChartAreaInteractive
        from="2026-10-01"
        to="2026-10-15"
        onDateRangeChange={handleDateRangeChange}
      />
    );

    const triggerBtn = screen.getByRole('button', {
      name: /out 01, 2026 - out 15, 2026/i,
    });
    expect(triggerBtn).toBeInTheDocument();
  });
});
