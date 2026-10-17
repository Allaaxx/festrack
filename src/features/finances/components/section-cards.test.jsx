import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SectionCards from './section-cards';

describe('SectionCards', () => {
  it('renders all four financial KPI cards with localized labels and values', () => {
    render(<SectionCards />);

    expect(screen.getByText('Receita Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 12.450,00')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText(/Crescimento este mês/)).toBeInTheDocument();

    expect(screen.getByText('Despesas do Mês')).toBeInTheDocument();
    expect(screen.getByText('R$ 3.820,00')).toBeInTheDocument();
    expect(screen.getByText('-5.2%')).toBeInTheDocument();
    expect(screen.getByText(/Redução de 5.2% no período/)).toBeInTheDocument();

    expect(screen.getByText('Investimentos Ativos')).toBeInTheDocument();
    expect(screen.getByText('R$ 45.670,00')).toBeInTheDocument();
    expect(screen.getByText('+15.0%')).toBeInTheDocument();
    expect(screen.getByText(/Rendimento acumulado/)).toBeInTheDocument();

    expect(screen.getByText('Saldo Geral')).toBeInTheDocument();
    expect(screen.getByText('R$ 8.630,00')).toBeInTheDocument();
    expect(screen.getByText('+8.4%')).toBeInTheDocument();
    expect(screen.getByText(/Balanço financeiro positivo/)).toBeInTheDocument();
  });
});
