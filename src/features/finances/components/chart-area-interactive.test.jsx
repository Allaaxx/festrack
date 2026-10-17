import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import ChartAreaInteractive from './chart-area-interactive';

describe('ChartAreaInteractive', () => {
  it('renders with 3 months active by default and updates description', () => {
    render(<ChartAreaInteractive />);

    expect(screen.getByText('Total de Visitantes')).toBeInTheDocument();
    expect(screen.getByText('Total dos últimos 3 meses')).toBeInTheDocument();

    const threeMonthsBtn = screen.getByRole('button', {
      name: 'Últimos 3 meses',
    });
    expect(threeMonthsBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('updates selection and description when clicking Últimos 30 dias', async () => {
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

  it('updates selection and description when clicking Últimos 7 dias', async () => {
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
});
