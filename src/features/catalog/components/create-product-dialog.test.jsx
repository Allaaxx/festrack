import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { ProductService } from '@/features/catalog/api/products';
import CreateProductDialog from '@/features/catalog/components/create-product-dialog';

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
  UNPROVIDED_SHOP_CONTEXT: Symbol('UNPROVIDED_SHOP_CONTEXT'),
}));

describe('CreateProductDialog', () => {
  let queryClient;

  const mockUser = {
    id: 'user-1',
    name: 'Ana Lojista',
    email: 'ana@festrack.com',
  };

  const mockShop = {
    id: 'shop-1',
    name: 'Festas Encantadas',
    role: 'OWNER',
  };

  const mockSimpleProducts = [
    {
      id: 'prod-1',
      shop_id: 'shop-1',
      name: 'Mesa Rústica Retangular 2m',
      type: 'rent',
      price: 120,
      is_bundle: false,
      stock: { quantity: 10, reserved: 2 },
    },
    {
      id: 'prod-2',
      shop_id: 'shop-1',
      name: 'Suporte para Doces Dourado',
      type: 'rent',
      price: 25,
      is_bundle: false,
      stock: { quantity: 30, reserved: 6 },
    },
    {
      id: 'prod-3',
      shop_id: 'shop-1',
      name: 'Montagem de Balões',
      type: 'service',
      price: 150,
      is_bundle: false,
      stock: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    useAuthContext.mockReturnValue({
      user: mockUser,
      isInitializing: false,
    });

    useShopContext.mockReturnValue({
      activeShop: mockShop,
      currentShop: mockShop,
      role: 'OWNER',
    });

    vi.spyOn(ProductService, 'getAll').mockResolvedValue(mockSimpleProducts);
    vi.spyOn(ProductService, 'create').mockImplementation(async (payload) => ({
      id: `prod-${Date.now()}`,
      shop_id: payload.shopId || 'shop-1',
      ...payload,
    }));
  });

  const renderDialog = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateProductDialog {...props} />
      </QueryClientProvider>
    );
  };

  it('renders default trigger button and opens dialog upon click', async () => {
    const user = userEvent.setup();
    renderDialog();

    const triggerBtn = screen.getByRole('button', { name: /novo produto/i });
    expect(triggerBtn).toBeInTheDocument();

    await user.click(triggerBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /novo produto/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /produto simples/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pacote virtual/i })).toBeInTheDocument();
  });

  it('validates that product name is required before calling ProductService.create', async () => {
    const user = userEvent.setup();
    renderDialog({ open: true });

    const submitBtn = screen.getByRole('button', { name: /criar produto/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/o nome é obrigatório/i)).toBeInTheDocument();
    expect(ProductService.create).not.toHaveBeenCalled();
  });

  it('submits a simple product with name, classification, price, and initial stock', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ open: true, onOpenChange });

    // 1. Fill Name
    const nameInput = screen.getByLabelText(/nome do produto/i);
    await user.type(nameInput, 'Cadeira Tiffany Dourada');

    // 2. Fill Description
    const descInput = screen.getByLabelText(/descrição/i);
    await user.type(descInput, 'Cadeira elegante para casamentos e banquetes.');

    // 3. Select Classification "Aluguel" (rent)
    const typeSelect = screen.getByLabelText(/classificação/i);
    await user.selectOptions(typeSelect, 'rent');

    // 4. Fill Price
    const priceInput = screen.getByLabelText(/preço do produto/i);
    await user.type(priceInput, '18');

    // 5. Fill Initial Stock
    const stockInput = screen.getByLabelText(/estoque inicial/i);
    await user.type(stockInput, '50');

    // 6. Submit
    const submitBtn = screen.getByRole('button', { name: /criar produto/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(ProductService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'shop-1',
          name: 'Cadeira Tiffany Dourada',
          description: 'Cadeira elegante para casamentos e banquetes.',
          type: 'rent',
          price: 18,
          quantity: 50,
          is_bundle: false,
        })
      );
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringMatching(/produto criado com sucesso/i),
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hides initial stock field when classification is set to service', async () => {
    const user = userEvent.setup();
    renderDialog({ open: true });

    expect(screen.getByLabelText(/estoque inicial/i)).toBeInTheDocument();

    const typeSelect = screen.getByLabelText(/classificação/i);
    await user.selectOptions(typeSelect, 'service');

    expect(screen.queryByLabelText(/estoque inicial/i)).not.toBeInTheDocument();
  });

  it('validates that a virtual bundle requires at least one component', async () => {
    const user = userEvent.setup();
    renderDialog({ open: true });

    // Switch to Virtual Bundle tab
    const bundleTab = screen.getByRole('tab', { name: /pacote virtual/i });
    await user.click(bundleTab);

    // Fill Name and Price
    const nameInput = screen.getByLabelText(/nome do pacote/i);
    await user.type(nameInput, 'Kit Festa Provençal Completo');

    const priceInput = screen.getByLabelText(/preço do pacote/i);
    await user.type(priceInput, '290');

    // Submit bundle without components
    const submitBtn = screen.getByRole('button', { name: /criar pacote/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/adicione pelo menos um componente ao pacote/i)
    ).toBeInTheDocument();
    expect(ProductService.create).not.toHaveBeenCalled();
  });

  it('adds components with multipliers, previews derived bottleneck availability, and creates virtual bundle', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ open: true, onOpenChange });

    // Switch to Virtual Bundle tab
    await user.click(screen.getByRole('tab', { name: /pacote virtual/i }));

    // Fill Bundle Name and Price
    const nameInput = screen.getByLabelText(/nome do pacote/i);
    await user.type(nameInput, 'Combo Mesa Rústica + Suportes');

    const priceInput = screen.getByLabelText(/preço do pacote/i);
    await user.type(priceInput, '190');

    // Wait for available simple products in picker
    const picker = await screen.findByLabelText(/selecionar componente/i);
    await user.selectOptions(picker, 'prod-1'); // Mesa: 10 - 2 = 8 available

    const addBtn = screen.getByRole('button', { name: /adicionar componente/i });
    await user.click(addBtn);

    // Verify component in list
    expect(screen.getByTestId('bundle-item-prod-1')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('bundle-item-prod-1')).getByText(
        'Mesa Rústica Retangular 2m'
      )
    ).toBeInTheDocument();

    // Add second component: Suporte: 30 - 6 = 24 available
    await user.selectOptions(picker, 'prod-2');
    await user.click(addBtn);
    expect(screen.getByTestId('bundle-item-prod-2')).toBeInTheDocument();

    // Adjust multiplier for Suporte to 4
    // 24 / 4 = 6 bundles available -> becomes bottleneck over Mesa (8 / 1 = 8)
    const suporteMultiplier = screen.getByLabelText(
      /quantidade de suporte para doces dourado/i
    );
    await user.clear(suporteMultiplier);
    await user.type(suporteMultiplier, '4');

    // Verify derived bottleneck preview
    const preview = screen.getByTestId('bundle-bottleneck-preview');
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByText(/6 unidades/i)).toBeInTheDocument();
    expect(within(preview).getByText(/suporte para doces dourado/i)).toBeInTheDocument();
    expect(within(preview).getByText(/limita em 6 pacotes/i)).toBeInTheDocument();

    // Submit Bundle
    const submitBtn = screen.getByRole('button', { name: /criar pacote/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(ProductService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'shop-1',
          name: 'Combo Mesa Rústica + Suportes',
          price: 190,
          is_bundle: true,
          bundle_items: expect.arrayContaining([
            expect.objectContaining({ product_id: 'prod-1', quantity: 1 }),
            expect.objectContaining({ product_id: 'prod-2', quantity: 4 }),
          ]),
        })
      );
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringMatching(/produto criado com sucesso/i),
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('allows removing a component from the bundle and recalculates availability', async () => {
    const user = userEvent.setup();
    renderDialog({ open: true });

    await user.click(screen.getByRole('tab', { name: /pacote virtual/i }));

    const picker = await screen.findByLabelText(/selecionar componente/i);
    const addBtn = screen.getByRole('button', { name: /adicionar componente/i });

    await user.selectOptions(picker, 'prod-1');
    await user.click(addBtn);
    expect(screen.getByTestId('bundle-item-prod-1')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', {
      name: /remover mesa rústica retangular 2m/i,
    });
    await user.click(removeBtn);

    expect(screen.queryByTestId('bundle-item-prod-1')).not.toBeInTheDocument();
    expect(
      screen.getByText(/nenhum componente adicionado ainda/i)
    ).toBeInTheDocument();
  });

  it('invalidates products and metrics query cache upon successful submission', async () => {
    const user = userEvent.setup();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderDialog({ open: true });

    const nameInput = screen.getByLabelText(/nome do produto/i);
    await user.type(nameInput, 'Produto Teste Cache');

    const priceInput = screen.getByLabelText(/preço do produto/i);
    await user.type(priceInput, '50');

    const submitBtn = screen.getByRole('button', { name: /criar produto/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['getProducts'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['catalogMetrics'] })
      );
    });
  });
});