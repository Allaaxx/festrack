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
    vi.spyOn(ProductService, 'update').mockImplementation(async (payload) => ({
      ...payload,
      shop_id: payload.shopId || 'shop-1',
    }));
  });

  const renderDialog = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateProductDialog {...props} />
      </QueryClientProvider>
    );
  };

  it('renders default trigger button and opens dialog with canonical "Pacote" tab upon click', async () => {
    const user = userEvent.setup();
    renderDialog();

    const triggerBtn = screen.getByRole('button', { name: /novo produto/i });
    expect(triggerBtn).toBeInTheDocument();

    await user.click(triggerBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: /novo produto/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /produto simples/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^pacote$/i })).toBeInTheDocument();
    expect(screen.queryByText(/pacote virtual/i)).not.toBeInTheDocument();
  });

  it('validates that product name is required before calling ProductService.create', async () => {
    const user = userEvent.setup();
    renderDialog({ open: true });

    const submitBtn = screen.getByRole('button', { name: /criar produto/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/o nome é obrigatório/i)
    ).toBeInTheDocument();
    expect(ProductService.create).not.toHaveBeenCalled();
  });

  it('submits a simple product with name, classification, price, and initial stock', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ open: true, onOpenChange });

    const nameInput = screen.getByLabelText(/nome do produto/i);
    await user.type(nameInput, 'Cadeira Tiffany Dourada');

    const descInput = screen.getByLabelText(/descrição/i);
    await user.type(descInput, 'Cadeira elegante para casamentos e banquetes.');

    const typeSelect = screen.getByLabelText(/classificação/i);
    await user.click(typeSelect);
    await user.click(await screen.findByRole('option', { name: /^aluguel$/i }));

    const priceInput = screen.getByLabelText(/preço do produto/i);
    await user.type(priceInput, '18');

    const stockInput = screen.getByLabelText(/estoque inicial/i);
    await user.type(stockInput, '50');

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
    await user.click(typeSelect);
    await user.click(await screen.findByRole('option', { name: /^serviço$/i }));

    expect(screen.queryByLabelText(/estoque inicial/i)).not.toBeInTheDocument();
  });

  it('validates that a bundle (Pacote) requires at least one component', async () => {
    const user = userEvent.setup();
    renderDialog({ open: true });

    const bundleTab = screen.getByRole('tab', { name: /^pacote$/i });
    await user.click(bundleTab);

    const nameInput = screen.getByLabelText(/nome do pacote/i);
    await user.type(nameInput, 'Kit Festa Provençal Completo');

    const priceInput = screen.getByLabelText(/preço do pacote/i);
    await user.type(priceInput, '290');

    const submitBtn = screen.getByRole('button', { name: /criar pacote/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/adicione pelo menos um componente ao pacote\./i)
    ).toBeInTheDocument();
    expect(ProductService.create).not.toHaveBeenCalled();
  });

  it('adds components with multipliers, previews derived bottleneck availability, and creates bundle', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ open: true, onOpenChange });

    await user.click(screen.getByRole('tab', { name: /^pacote$/i }));

    const nameInput = screen.getByLabelText(/nome do pacote/i);
    await user.type(nameInput, 'Pacote Mesa Rústica + Suportes');

    const priceInput = screen.getByLabelText(/preço do pacote/i);
    await user.type(priceInput, '190');

    const picker = await screen.findByLabelText(/selecionar componente/i);
    await user.click(picker);
    await user.click(
      await screen.findByRole('option', { name: /mesa rústica retangular 2m/i })
    );

    const addBtn = screen.getByRole('button', {
      name: /adicionar componente/i,
    });
    await user.click(addBtn);

    expect(screen.getByTestId('bundle-item-prod-1')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('bundle-item-prod-1')).getByText(
        'Mesa Rústica Retangular 2m'
      )
    ).toBeInTheDocument();

    await user.click(picker);
    await user.click(
      await screen.findByRole('option', { name: /suporte para doces dourado/i })
    );
    await user.click(addBtn);
    expect(screen.getByTestId('bundle-item-prod-2')).toBeInTheDocument();

    const suporteMultiplier = screen.getByLabelText(
      /quantidade de suporte para doces dourado/i
    );
    await user.clear(suporteMultiplier);
    await user.type(suporteMultiplier, '4');

    const preview = screen.getByTestId('bundle-bottleneck-preview');
    expect(preview).toBeInTheDocument();
    expect(within(preview).getByText(/6 unidades/i)).toBeInTheDocument();
    expect(
      within(preview).getByText(/suporte para doces dourado/i)
    ).toBeInTheDocument();
    expect(
      within(preview).getByText(/limita em 6 pacotes/i)
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /criar pacote/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(ProductService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'shop-1',
          name: 'Pacote Mesa Rústica + Suportes',
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

    await user.click(screen.getByRole('tab', { name: /^pacote$/i }));

    const picker = await screen.findByLabelText(/selecionar componente/i);
    const addBtn = screen.getByRole('button', {
      name: /adicionar componente/i,
    });

    await user.click(picker);
    await user.click(
      await screen.findByRole('option', { name: /mesa rústica retangular 2m/i })
    );
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

  it('prefills simple product fields in edit mode and submits via ProductService.update', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const existingProduct = {
      id: 'prod-1',
      shop_id: 'shop-1',
      name: 'Mesa Rústica Retangular 2m',
      description: 'Mesa original',
      type: 'rent',
      price: 120,
      is_bundle: false,
      stock: { quantity: 10, reserved: 2 },
    };

    renderDialog({ open: true, onOpenChange, product: existingProduct });

    expect(
      screen.getByRole('heading', { name: /editar produto/i })
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/nome do produto/i);
    expect(nameInput).toHaveValue('Mesa Rústica Retangular 2m');

    await user.clear(nameInput);
    await user.type(nameInput, 'Mesa Rústica Retangular 3m');

    const submitBtn = screen.getByRole('button', {
      name: /salvar alterações/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(ProductService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'shop-1',
          id: 'prod-1',
          name: 'Mesa Rústica Retangular 3m',
          type: 'rent',
          price: 120,
          is_bundle: false,
        })
      );
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringMatching(/produto atualizado com sucesso/i),
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('prefills bundle fields and components in edit mode and submits updated bundle_items via ProductService.update', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const existingBundle = {
      id: 'bundle-1',
      shop_id: 'shop-1',
      name: 'Pacote Festa Provençal',
      description: 'Pacote de locação',
      type: 'rent',
      price: 350,
      is_bundle: true,
      bundle_items: [
        {
          id: 'bi-1',
          product_id: 'prod-1',
          quantity: 2,
          componentProduct: mockSimpleProducts[0],
        },
      ],
    };

    renderDialog({ open: true, onOpenChange, product: existingBundle });

    expect(
      screen.getByRole('heading', { name: /editar pacote/i })
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/nome do pacote/i);
    expect(nameInput).toHaveValue('Pacote Festa Provençal');
    expect(screen.getByTestId('bundle-item-prod-1')).toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, 'Pacote Festa Provençal Premium');

    const submitBtn = screen.getByRole('button', {
      name: /salvar alterações/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(ProductService.update).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'shop-1',
          id: 'bundle-1',
          name: 'Pacote Festa Provençal Premium',
          price: 350,
          is_bundle: true,
          bundle_items: [{ product_id: 'prod-1', quantity: 2 }],
        })
      );
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
