import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ShopContext } from '@/contexts/shop';

import CatalogOperationalGrid from './catalog-operational-grid';

const MOCK_PRODUCTS = [
  {
    id: 'prod-rent-1',
    name: 'Painel Redondo Dourado',
    slug: 'painel-redondo-dourado',
    type: 'rent',
    is_bundle: false,
    price: 180,
    stock: { quantity: 10, reserved: 4 },
  },
  {
    id: 'prod-rent-2',
    name: 'Mesa Cilindro Acrílico',
    slug: 'mesa-cilindro-acrilico',
    type: 'rent',
    is_bundle: false,
    price: 220,
    stock: { quantity: 5, reserved: 5 },
  },
  {
    id: 'prod-sale-1',
    name: 'Balões Metalizados Rose Gold',
    slug: 'baloes-metalizados-rose-gold',
    type: 'sale',
    is_bundle: false,
    price: 45,
    stock: { quantity: 30, reserved: 6 },
  },
  {
    id: 'prod-bundle-1',
    name: 'Kit Festa Luxo Completo',
    slug: 'kit-festa-luxo-completo',
    type: 'rent',
    is_bundle: true,
    price: 590,
    bundle_items: [{ product_id: 'prod-rent-1', quantity: 2 }],
  },
];

describe('CatalogOperationalGrid', () => {
  it('renders ShopDistributionCard with active shop info and recalculates category pills (Aluguel, Venda, Pacote)', async () => {
    const user = userEvent.setup();

    render(
      <ShopContext.Provider
        value={{
          activeShop: { id: 'shop-1', name: 'Festrack Eventos' },
          shops: [],
          isLoading: false,
        }}
      >
        <CatalogOperationalGrid products={MOCK_PRODUCTS} />
      </ShopContext.Provider>
    );

    const distributionCard = screen.getByTestId('shop-distribution-card');
    expect(distributionCard).toBeInTheDocument();
    expect(screen.getByText('Festrack Eventos')).toBeInTheDocument();
    expect(screen.getByText('Catálogo da Loja')).toBeInTheDocument();

    // Default selected pill is Aluguel:
    // prod-rent-1: available 6, reserved 4
    // prod-rent-2: available 0 (exhausted), reserved 5
    // Total units in Aluguel = 6 + 4 + 0 + 5 = 15
    expect(distributionCard).toHaveTextContent('15');
    expect(distributionCard).toHaveTextContent('Unidades');
    expect(distributionCard).toHaveTextContent('Disponível');
    expect(distributionCard).toHaveTextContent('Reservado');
    expect(distributionCard).toHaveTextContent('Esgotado');

    // Switch to Venda pill
    const saleTab = screen.getByRole('tab', { name: /venda/i });
    await user.click(saleTab);

    // prod-sale-1: available 24, reserved 6 -> total 30 units
    expect(distributionCard).toHaveTextContent('30');
    expect(distributionCard).toHaveTextContent('24');

    // Switch to Pacote pill
    const bundleTab = screen.getByRole('tab', { name: /pacote/i });
    await user.click(bundleTab);

    // prod-bundle-1 uses 2x prod-rent-1 (available 6) -> bottleneck availableStock = 3
    expect(distributionCard).toHaveTextContent('3');
  });

  it('renders StockMovementsTimelineCard with underline tabs (Entradas, Reservas, Baixas) and 2-node timeline items', async () => {
    const user = userEvent.setup();
    const movements = [
      {
        id: 'mov-1',
        type: 'INBOUND',
        productName: 'Painel Redondo Dourado',
        slug: 'painel-redondo-dourado',
        quantity: 10,
        date: '2026-11-12T10:00:00.000Z',
        note: 'Recebimento de lote novo',
      },
      {
        id: 'mov-2',
        type: 'RENTAL_ALLOCATION',
        productName: 'Mesa Cilindro Acrílico',
        slug: 'mesa-cilindro-acrilico',
        quantity: 4,
        date: '2026-11-11T14:30:00.000Z',
        note: 'Alocação para Casamento Marina & Lucas',
      },
      {
        id: 'mov-3',
        type: 'LOSS',
        productName: 'Vaso de Vidro Espelhado',
        slug: 'vaso-vidro-espelhado',
        quantity: 2,
        date: '2026-11-09T18:00:00.000Z',
        note: 'Avaria no retorno do evento',
      },
    ];

    render(
      <CatalogOperationalGrid products={MOCK_PRODUCTS} movements={movements} />
    );

    const timelineCard = screen.getByTestId('stock-movements-timeline-card');
    expect(timelineCard).toBeInTheDocument();
    expect(timelineCard).toHaveTextContent('Movimentações de Estoque');
    expect(timelineCard).toHaveTextContent('3 movimentações registradas');

    // Default tab is Entradas
    expect(timelineCard).toHaveTextContent('Produto');
    expect(timelineCard).toHaveTextContent('Painel Redondo Dourado');
    expect(timelineCard).toHaveTextContent('Registro');
    expect(timelineCard).toHaveTextContent('+10 un • Entrada em estoque');
    expect(timelineCard).toHaveTextContent('Recebimento de lote novo');

    // Switch to Reservas tab
    const reservasTab = screen.getByRole('tab', { name: /reservas/i });
    await user.click(reservasTab);

    expect(timelineCard).toHaveTextContent('Mesa Cilindro Acrílico');
    expect(timelineCard).toHaveTextContent('4 un • Reservado em evento');
    expect(timelineCard).toHaveTextContent(
      'Alocação para Casamento Marina & Lucas'
    );

    // Switch to Baixas tab
    const baixasTab = screen.getByRole('tab', { name: /baixas/i });
    await user.click(baixasTab);

    expect(timelineCard).toHaveTextContent('Vaso de Vidro Espelhado');
    expect(timelineCard).toHaveTextContent('-2 un • Baixa de estoque');
    expect(timelineCard).toHaveTextContent('Avaria no retorno do evento');
  });

  it('shows empty state across tabs when movements is empty instead of synthesizing movements from products', async () => {
    const user = userEvent.setup();

    render(<CatalogOperationalGrid products={MOCK_PRODUCTS} movements={[]} />);

    const timelineCard = screen.getByTestId('stock-movements-timeline-card');
    expect(timelineCard).toHaveTextContent('0 movimentações registradas');
    expect(timelineCard).toHaveTextContent(
      'Nenhuma movimentação registrada nesta categoria.'
    );
    expect(timelineCard).not.toHaveTextContent('Painel Redondo Dourado');

    const baixasTab = screen.getByRole('tab', { name: /baixas/i });
    await user.click(baixasTab);

    expect(timelineCard).toHaveTextContent(
      'Nenhuma movimentação registrada nesta categoria.'
    );
  });

  it('renders PopularProductsCard with top products, formatted BRL prices, and stock/allocation counters', () => {
    render(<CatalogOperationalGrid products={MOCK_PRODUCTS} />);

    const popularCard = screen.getByTestId('popular-products-card');
    expect(popularCard).toBeInTheDocument();
    expect(popularCard).toHaveTextContent('Produtos Populares');
    expect(popularCard).toHaveTextContent('Total de 4 itens no catálogo');

    // Product names and formatted prices
    expect(popularCard).toHaveTextContent('Balões Metalizados Rose Gold');
    expect(popularCard).toHaveTextContent(/R\$\s*45,00/);
    expect(popularCard).toHaveTextContent('6 alocados');

    expect(popularCard).toHaveTextContent('Kit Festa Luxo Completo');
    expect(popularCard).toHaveTextContent(/R\$\s*590,00/);
    expect(popularCard).toHaveTextContent('3 disp.');
  });

  it('renders empty state in PopularProductsCard when products is empty', () => {
    render(<CatalogOperationalGrid products={[]} />);

    const popularCard = screen.getByTestId('popular-products-card');
    expect(popularCard).toHaveTextContent('Total de 0 itens no catálogo');
    expect(popularCard).toHaveTextContent('Nenhum produto cadastrado na loja.');
  });

  it('renders skeleton placeholders in all three cards when isLoading is true', () => {
    render(<CatalogOperationalGrid isLoading />);

    const distributionCard = screen.getByTestId('shop-distribution-card');
    const timelineCard = screen.getByTestId('stock-movements-timeline-card');
    const popularCard = screen.getByTestId('popular-products-card');

    expect(
      distributionCard.querySelector('[data-slot="skeleton"]')
    ).toBeInTheDocument();
    expect(
      timelineCard.querySelector('[data-slot="skeleton"]')
    ).toBeInTheDocument();
    expect(
      popularCard.querySelector('[data-slot="skeleton"]')
    ).toBeInTheDocument();
  });
});
