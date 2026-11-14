import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { ProductService } from '@/features/catalog/api/products';
import CatalogTable from '@/features/catalog/components/catalog-table';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
  UNPROVIDED_SHOP_CONTEXT: Symbol('UNPROVIDED_SHOP_CONTEXT'),
}));

describe('CatalogTable', () => {
  let queryClient;

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

  const outOfStockItem = {
    id: 'prod-out',
    name: 'Toalha de Mesa Dourada',
    description: 'Tecido jacquard',
    type: 'rent',
    price: 45,
    images: [],
    is_bundle: false,
    stock: { quantity: 4, reserved: 4 }, // available = 0
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
        quantity: 2, // 6 / 2 = 3 (bottleneck <= 3 -> low stock!)
        componentProduct: balloonItem,
      },
    ],
  };

  const testProducts = [
    tableItem,
    balloonItem,
    serviceItem,
    outOfStockItem,
    bundleItem,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAuthContext.mockReturnValue({ user: mockUser });
    useShopContext.mockReturnValue({
      activeShop: mockShop,
      currentShop: mockShop,
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CatalogTable products={testProducts} {...props} />
      </QueryClientProvider>
    );
  };

  it('renders table columns, canonical "Pacote" badge, formatted prices, stock indicators, and pagination footer', () => {
    renderComponent();

    // Check table headers
    expect(
      screen.getByRole('columnheader', { name: /produto/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /classificação/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /preço/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /estoque/i })
    ).toBeInTheDocument();

    // Verify product names rendered
    expect(screen.getByText('Mesa Provençal Branca')).toBeInTheDocument();
    expect(screen.getByText('Arco Orgânico de Balões')).toBeInTheDocument();
    expect(
      screen.getByText('Serviço de Montagem de Painel')
    ).toBeInTheDocument();
    expect(screen.getByText('Toalha de Mesa Dourada')).toBeInTheDocument();
    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();

    // Verify classification badges within table use canonical "Pacote" (never "Pacote Virtual")
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Aluguel').length).toBeGreaterThanOrEqual(
      1
    );
    expect(within(table).getByText('Venda')).toBeInTheDocument();
    expect(within(table).getByText('Serviço')).toBeInTheDocument();
    expect(within(table).getByText('Pacote')).toBeInTheDocument();
    expect(within(table).queryByText('Pacote Virtual')).not.toBeInTheDocument();

    // Verify price formatting (BRL)
    expect(screen.getByText(/R\$\s*120,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*200,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*45,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*320,00/)).toBeInTheDocument();

    // Verify stock displays
    expect(screen.getByText('12 un')).toBeInTheDocument();
    expect(screen.getByText('6 un')).toBeInTheDocument();
    expect(screen.getByText('Não se aplica')).toBeInTheDocument();
    expect(within(table).getByText('Esgotado')).toBeInTheDocument();
    expect(screen.getByText('3 un')).toBeInTheDocument();

    // Verify pagination footer
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument();
    expect(screen.getByText('Linhas por página')).toBeInTheDocument();
  });

  it('filters table rows in real-time when typing in search bar', async () => {
    const user = userEvent.setup();
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/buscar produtos/i);
    await user.type(searchInput, 'Balões');

    expect(screen.getByText('Arco Orgânico de Balões')).toBeInTheDocument();
    expect(screen.queryByText('Mesa Provençal Branca')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Serviço de Montagem de Painel')
    ).not.toBeInTheDocument();
  });

  it('filters table rows when selecting options in the Category Select dropdown', async () => {
    const user = userEvent.setup();
    renderComponent();

    const categoryTrigger = screen.getByRole('combobox', {
      name: /filtrar por categoria/i,
    });

    // Select "Venda"
    await user.click(categoryTrigger);
    await user.click(await screen.findByRole('option', { name: /^venda$/i }));

    expect(screen.getByText('Arco Orgânico de Balões')).toBeInTheDocument();
    expect(screen.queryByText('Mesa Provençal Branca')).not.toBeInTheDocument();
    expect(screen.queryByText('Pacote Festa Completa')).not.toBeInTheDocument();

    // Select "Pacote"
    await user.click(categoryTrigger);
    await user.click(await screen.findByRole('option', { name: /^pacote$/i }));

    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();
    expect(
      screen.queryByText('Arco Orgânico de Balões')
    ).not.toBeInTheDocument();

    // Select "Serviço"
    await user.click(categoryTrigger);
    await user.click(await screen.findByRole('option', { name: /^serviço$/i }));

    expect(
      screen.getByText('Serviço de Montagem de Painel')
    ).toBeInTheDocument();
    expect(screen.queryByText('Pacote Festa Completa')).not.toBeInTheDocument();

    // Select "Todos"
    await user.click(categoryTrigger);
    await user.click(await screen.findByRole('option', { name: /todos/i }));

    expect(screen.getByText('Mesa Provençal Branca')).toBeInTheDocument();
    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();
  });

  it('filters table rows when selecting options in the Stock Status Select dropdown', async () => {
    const user = userEvent.setup();
    renderComponent();

    const stockTrigger = screen.getByRole('combobox', {
      name: /filtrar por status de estoque/i,
    });

    // Select "Baixo Estoque" -> only bundleItem (bottleneck available = 3) matches
    await user.click(stockTrigger);
    await user.click(
      await screen.findByRole('option', { name: /baixo estoque/i })
    );

    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();
    expect(screen.queryByText('Mesa Provençal Branca')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Toalha de Mesa Dourada')
    ).not.toBeInTheDocument();

    // Select "Esgotado" -> only outOfStockItem (available = 0) matches
    await user.click(stockTrigger);
    await user.click(await screen.findByRole('option', { name: /esgotado/i }));

    expect(screen.getByText('Toalha de Mesa Dourada')).toBeInTheDocument();
    expect(screen.queryByText('Pacote Festa Completa')).not.toBeInTheDocument();
    expect(screen.queryByText('Mesa Provençal Branca')).not.toBeInTheDocument();

    // Select "Disponível" -> items with available > 0 or service
    await user.click(stockTrigger);
    await user.click(
      await screen.findByRole('option', { name: /disponível/i })
    );

    expect(screen.getByText('Mesa Provençal Branca')).toBeInTheDocument();
    expect(screen.getByText('Arco Orgânico de Balões')).toBeInTheDocument();
    expect(
      screen.getByText('Serviço de Montagem de Painel')
    ).toBeInTheDocument();
    expect(screen.getByText('Pacote Festa Completa')).toBeInTheDocument();
    expect(
      screen.queryByText('Toalha de Mesa Dourada')
    ).not.toBeInTheDocument();
  });

  it('customizes column visibility via Personalizar Colunas and opens creation modal via + Adicionar produto button', async () => {
    const user = userEvent.setup();
    renderComponent();

    expect(
      screen.getByRole('columnheader', { name: /classificação/i })
    ).toBeInTheDocument();

    const customizeBtn = screen.getByRole('button', {
      name: /personalizar colunas/i,
    });
    await user.click(customizeBtn);

    const classificationOption = await screen.findByRole('menuitemcheckbox', {
      name: /classificação/i,
    });
    await user.click(classificationOption);

    expect(
      screen.queryByRole('columnheader', { name: /classificação/i })
    ).not.toBeInTheDocument();

    // Open creation dialog from toolbar "+ Adicionar produto" button
    const addProductBtn = screen.getByRole('button', {
      name: /adicionar produto/i,
    });
    await user.click(addProductBtn);

    expect(
      await screen.findByRole('heading', { name: /novo produto/i })
    ).toBeInTheDocument();
  });

  it('renders accessible drag handles and reorders rows', () => {
    renderComponent();

    const firstRowHandle = screen.getByRole('button', {
      name: /reordenar mesa provençal branca/i,
    });
    expect(firstRowHandle).toBeInTheDocument();

    const initialRows = screen.getAllByTestId('catalog-row');
    expect(
      within(initialRows[0]).getByText('Mesa Provençal Branca')
    ).toBeInTheDocument();
    expect(
      within(initialRows[1]).getByText('Arco Orgânico de Balões')
    ).toBeInTheDocument();

    // Move first row down using keyboard ArrowDown on grip handle
    fireEvent.keyDown(firstRowHandle, { key: 'ArrowDown' });

    const reorderedRows = screen.getAllByTestId('catalog-row');
    expect(
      within(reorderedRows[0]).getByText('Arco Orgânico de Balões')
    ).toBeInTheDocument();
    expect(
      within(reorderedRows[1]).getByText('Mesa Provençal Branca')
    ).toBeInTheDocument();
  });

  it('opens prefilled Edit modal, Stock Adjustment modal, and Delete confirmation dialog from row actions', async () => {
    const user = userEvent.setup();
    const deleteSpy = vi
      .spyOn(ProductService, 'delete')
      .mockResolvedValue({ success: true });
    const handleAction = vi.fn();

    renderComponent({ onAction: handleAction });

    // 1. Open row actions for simple product and click "Ajustar Estoque"
    await user.click(
      screen.getByRole('button', {
        name: /ações para mesa provençal branca/i,
      })
    );

    expect(
      await screen.findByRole('menuitem', { name: /editar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /ajustar estoque/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /excluir/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: /ajustar estoque/i }));
    expect(handleAction).toHaveBeenCalledWith('adjust-stock', tableItem);

    expect(
      await screen.findByRole('heading', { name: /ajustar estoque/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // 2. Open row actions for bundle and click "Editar" -> opens prefilled Editar Pacote modal
    await user.click(
      screen.getByRole('button', {
        name: /ações para pacote festa completa/i,
      })
    );
    await user.click(await screen.findByRole('menuitem', { name: /editar/i }));

    expect(handleAction).toHaveBeenCalledWith('edit', bundleItem);
    expect(
      await screen.findByRole('heading', { name: /editar pacote/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nome do pacote/i)).toHaveValue(
      'Pacote Festa Completa'
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // 3. Open row actions and click "Excluir" -> opens ConfirmDeleteDialog and calls delete mutation
    await user.click(
      screen.getByRole('button', {
        name: /ações para arco orgânico de balões/i,
      })
    );
    await user.click(await screen.findByRole('menuitem', { name: /excluir/i }));

    expect(handleAction).toHaveBeenCalledWith('delete', balloonItem);
    expect(
      await screen.findByRole('heading', { name: /excluir produto/i })
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /^excluir$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'prod-balloon',
          shopId: 'shop-1',
        })
      );
    });
  });

  it('opens product details Drawer when clicking a row', async () => {
    const user = userEvent.setup();
    renderComponent();

    const row = screen.getByText('Mesa Provençal Branca').closest('tr');
    await user.click(row);

    expect(
      await screen.findByText('Detalhes do Produto')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/informações completas de mesa provençal branca/i)
    ).toBeInTheDocument();
  });

  it('renders bottleneck popover when inspecting bundle stock without opening drawer', async () => {
    const user = userEvent.setup();
    renderComponent();

    const bundleStockTrigger = screen.getByRole('button', {
      name: /estoque do pacote pacote festa completa/i,
    });
    await user.click(bundleStockTrigger);

    expect(
      await screen.findByText(/composição & gargalo do pacote/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Gargalo Limitador')).toBeInTheDocument();
    expect(screen.queryByText('Detalhes do Produto')).not.toBeInTheDocument();
  });
});
