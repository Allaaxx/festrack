import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import CatalogTable from '@/features/catalog/components/catalog-table';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
  UNPROVIDED_SHOP_CONTEXT: Symbol('UNPROVIDED_SHOP_CONTEXT'),
}));

describe('CatalogTable', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockUser = { id: 'usr-1', name: 'Ana', email: 'ana@festrack.com' };
  const mockShop = { id: 'shop-1', name: 'Loja Festas' };

  const tableItem = {
    id: 'prod-table',
    name: 'Mesa Provençal Branca',
    description: 'Mesa de festa',
    type: 'rent',
    price: 120,
    images: ['https://example.com/mesa.jpg'],
    is_bundle: false,
    stock: { quantity: 15, reserved: 3 }, // available = 12
  };

  const balloonItem = {
    id: 'prod-balloon',
    name: 'Arco Orgânico de Balões',
    description: 'Balões metalizados',
    type: 'sale',
    price: 150,
    images: [],
    is_bundle: false,
    stock: { quantity: 8, reserved: 2 }, // available = 6
  };

  const serviceItem = {
    id: 'prod-service',
    name: 'Serviço de Montagem de Painel',
    description: 'Instalação completa',
    type: 'service',
    price: 200,
    images: [],
    is_bundle: false,
    stock: null,
  };

  const bundleItem = {
    id: 'bundle-party',
    name: 'Pacote Festa Completa',
    description: 'Kit mesa + balões',
    type: 'rent',
    price: 320,
    images: ['https://example.com/kit.jpg'],
    is_bundle: true,
    stock: null,
    bundle_items: [
      {
        id: 'bi-1',
        product_id: 'prod-table',
        quantity: 1, // 12 / 1 = 12
        componentProduct: tableItem,
      },
      {
        id: 'bi-2',
        product_id: 'prod-balloon',
        quantity: 2, // 6 / 2 = 3 (bottleneck!)
        componentProduct: balloonItem,
      },
    ],
  };

  const testProducts = [tableItem, balloonItem, serviceItem, bundleItem];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({ user: mockUser });
    useShopContext.mockReturnValue({ activeShop: mockShop, currentShop: mockShop });
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CatalogTable products={testProducts} {...props} />
      </QueryClientProvider>
    );
  };

  it('renders table columns: image, name, classification badge, formatted price, available stock and actions', () => {
    renderComponent();

    // Check table headers
    expect(screen.getByRole('columnheader', { name: /produto/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /classificação/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /preço/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /estoque/i })).toBeInTheDocument();

    // Verify product names rendered
    expect(screen.getByText('Mesa Provençal Branca')).toBeInTheDocument();
    expect(screen.getByText('Arco Orgânico de Balões')).toBeInTheDocument();
    expect(screen.getByText('Serviço de Montagem de Painel')).toBeInTheDocument();
    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();

    // Verify classification badges within table
    const table = screen.getByRole('table');
    expect(within(table).getByText('Aluguel')).toBeInTheDocument();
    expect(within(table).getByText('Venda')).toBeInTheDocument();
    expect(within(table).getByText('Serviço')).toBeInTheDocument();
    expect(within(table).getByText('Pacote Virtual')).toBeInTheDocument();

    // Verify price formatting (BRL)
    expect(screen.getByText(/R\$\s*120,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*200,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*320,00/)).toBeInTheDocument();

    // Verify stock displays
    expect(screen.getByText('12 un')).toBeInTheDocument(); // Table available
    expect(screen.getByText('6 un')).toBeInTheDocument(); // Balloon available
    expect(screen.getByText('Não se aplica')).toBeInTheDocument(); // Service
    expect(screen.getByText('3 un')).toBeInTheDocument(); // Bundle bottleneck stock
  });

  it('filters table rows in real-time when typing in search bar', async () => {
    const user = userEvent.setup();
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/buscar produtos/i);
    await user.type(searchInput, 'Balões');

    expect(screen.getByText('Arco Orgânico de Balões')).toBeInTheDocument();
    expect(screen.queryByText('Mesa Provençal Branca')).not.toBeInTheDocument();
    expect(screen.queryByText('Serviço de Montagem de Painel')).not.toBeInTheDocument();
  });

  it('filters table rows when selecting classification tabs', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click "Venda" tab
    const saleTab = screen.getByRole('tab', { name: /venda/i });
    await user.click(saleTab);

    expect(screen.getByText('Arco Orgânico de Balões')).toBeInTheDocument();
    expect(screen.queryByText('Mesa Provençal Branca')).not.toBeInTheDocument();
    expect(screen.queryByText('Pacote Festa Completa')).not.toBeInTheDocument();

    // Click "Pacote Virtual" tab
    const bundleTab = screen.getByRole('tab', { name: /pacote virtual/i });
    await user.click(bundleTab);

    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();
    expect(screen.queryByText('Arco Orgânico de Balões')).not.toBeInTheDocument();

    // Click "Todos" tab
    const allTab = screen.getByRole('tab', { name: /todos/i });
    await user.click(allTab);

    expect(screen.getByText('Mesa Provençal Branca')).toBeInTheDocument();
    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();
  });

  it('displays contextual actions menu for simple products: Editar, Ajustar Estoque, Histórico', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    renderComponent({ onAction: handleAction });

    const actionButton = screen.getByRole('button', {
      name: /ações para mesa provençal branca/i,
    });
    await user.click(actionButton);

    expect(await screen.findByRole('menuitem', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /ajustar estoque/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /histórico/i })).toBeInTheDocument();

    // Click on Ajustar Estoque
    await user.click(screen.getByRole('menuitem', { name: /ajustar estoque/i }));
    expect(handleAction).toHaveBeenCalledWith('adjust-stock', tableItem);
  });

  it('displays contextual actions menu for services: Editar, Desativar', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    renderComponent({ onAction: handleAction });

    const actionButton = screen.getByRole('button', {
      name: /ações para serviço de montagem/i,
    });
    await user.click(actionButton);

    expect(await screen.findByRole('menuitem', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /desativar/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /ajustar estoque/i })).not.toBeInTheDocument();
  });

  it('displays contextual actions menu for virtual bundles: Editar Composição, Inspecionar Componentes', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    renderComponent({ onAction: handleAction });

    const actionButton = screen.getByRole('button', {
      name: /ações para pacote festa completa/i,
    });
    await user.click(actionButton);

    expect(await screen.findByRole('menuitem', { name: /editar composição/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /inspecionar componentes/i })).toBeInTheDocument();
  });

  it('renders bottleneck popover when inspecting bundle stock', async () => {
    const user = userEvent.setup();
    renderComponent();

    const bundleStockTrigger = screen.getByRole('button', {
      name: /estoque do pacote pacote festa completa/i,
    });
    await user.click(bundleStockTrigger);

    expect(await screen.findByText(/composição & gargalo do pacote/i)).toBeInTheDocument();
    expect(screen.getByText('Gargalo Limitador')).toBeInTheDocument();
  });
});
