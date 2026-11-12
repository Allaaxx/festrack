import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import { ProductService } from '@/features/catalog/api/products';
import StockAdjustDialog from '@/features/catalog/components/stock-adjust-dialog';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
  UNPROVIDED_SHOP_CONTEXT: Symbol('UNPROVIDED_SHOP_CONTEXT'),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { add: vi.fn() },
}));

describe('StockAdjustDialog', () => {
  let queryClient;
  const mockUser = { id: 'usr-1', name: 'Ana', email: 'ana@festrack.com' };
  const mockShop = { id: 'shop-1', name: 'Loja Festas' };

  const testProduct = {
    id: 'prod-chair-1',
    name: 'Cadeira Tiffany Dourada',
    slug: 'cadeira-tiffany-dourada',
    type: 'rent',
    price: 35,
    stock: {
      quantity: 50,
      reserved: 12,
    },
  };

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.spyOn(queryClient, 'invalidateQueries');

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({ user: mockUser });
    useShopContext.mockReturnValue({ activeShop: mockShop, currentShop: mockShop });
    vi.spyOn(ProductService, 'adjustStock').mockResolvedValue({
      stock: { quantity: 55, reserved: 12 },
      movement: { id: 'mov-1', type: 'INBOUND', quantity: 5 },
    });
  });

  it('renders nothing in view when open is false', () => {
    render(
      <StockAdjustDialog
        open={false}
        onOpenChange={vi.fn()}
        product={testProduct}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('heading', { name: /ajustar estoque/i })).not.toBeInTheDocument();
  });

  it('renders modal with product details: name, current on-hand quantity, and reserved stock', () => {
    render(
      <StockAdjustDialog
        open={true}
        onOpenChange={vi.fn()}
        product={testProduct}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('heading', { name: /ajustar estoque/i })).toBeInTheDocument();
    expect(screen.getByText('Cadeira Tiffany Dourada')).toBeInTheDocument();
    expect(screen.getByText(/50\s*un/i)).toBeInTheDocument();
    expect(screen.getByText(/12\s*un/i)).toBeInTheDocument();

    // Verify form fields rendered
    expect(screen.getByLabelText(/tipo de movimentação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantidade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar ajuste/i })).toBeInTheDocument();
  });

  it('displays validation errors and prevents submission when quantity < 1 or reason < 3 characters', async () => {
    const user = userEvent.setup();
    render(
      <StockAdjustDialog
        open={true}
        onOpenChange={vi.fn()}
        product={testProduct}
      />,
      { wrapper: createWrapper() }
    );

    // Clear quantity to 0
    const quantityInput = screen.getByLabelText(/quantidade/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '0');

    // Submit with empty reason
    const submitButton = screen.getByRole('button', { name: /confirmar ajuste/i });
    await user.click(submitButton);

    expect(await screen.findByText(/quantidade deve ser maior ou igual a 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/motivo deve ter pelo menos 3 caracteres/i)).toBeInTheDocument();
    expect(ProductService.adjustStock).not.toHaveBeenCalled();

    // Type too short reason
    const reasonInput = screen.getByLabelText(/motivo/i);
    await user.type(reasonInput, 'oi');
    await user.click(submitButton);

    expect(await screen.findByText(/motivo deve ter pelo menos 3 caracteres/i)).toBeInTheDocument();
    expect(ProductService.adjustStock).not.toHaveBeenCalled();
  });

  it('submits adjustment successfully with INBOUND type, invalidates cache and closes dialog', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <StockAdjustDialog
        open={true}
        onOpenChange={handleOpenChange}
        product={testProduct}
        onSuccess={handleSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Select INBOUND movement type
    const typeSelectTrigger = screen.getByLabelText(/tipo de movimentação/i);
    await user.click(typeSelectTrigger);
    const inboundOption = await screen.findByRole('option', {
      name: /nova entrada \/ compra/i,
    });
    await user.click(inboundOption);

    // Enter quantity
    const quantityInput = screen.getByLabelText(/quantidade/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '10');

    // Enter audit reason
    const reasonInput = screen.getByLabelText(/motivo/i);
    await user.type(reasonInput, 'Recebimento de novo lote do fornecedor');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /confirmar ajuste/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ProductService.adjustStock).toHaveBeenCalledWith({
        shopId: 'shop-1',
        productId: 'prod-chair-1',
        delta: 10,
        type: 'INBOUND',
        reason: 'Recebimento de novo lote do fornecedor',
      });
    });

    // Check cache invalidation
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['getProducts', 'shop-1'],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['catalogMetrics', 'usr-1', 'shop-1'],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['stockMovements', 'usr-1', 'shop-1', { from: undefined, to: undefined, period: undefined }],
    });

    // Check toast and close
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      description: 'Estoque ajustado com sucesso!',
    });
    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(handleSuccess).toHaveBeenCalled();
  });

  it('submits adjustment successfully with LOSS type', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <StockAdjustDialog
        open={true}
        onOpenChange={handleOpenChange}
        product={testProduct}
      />,
      { wrapper: createWrapper() }
    );

    // Select LOSS movement type
    const typeSelectTrigger = screen.getByLabelText(/tipo de movimentação/i);
    await user.click(typeSelectTrigger);
    const lossOption = await screen.findByRole('option', {
      name: /descarte \/ perda/i,
    });
    await user.click(lossOption);

    // Enter quantity
    const quantityInput = screen.getByLabelText(/quantidade/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    // Enter audit reason
    const reasonInput = screen.getByLabelText(/motivo/i);
    await user.type(reasonInput, 'Peças danificadas no transporte de retorno');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /confirmar ajuste/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(ProductService.adjustStock).toHaveBeenCalledWith({
        shopId: 'shop-1',
        productId: 'prod-chair-1',
        delta: 2,
        type: 'LOSS',
        reason: 'Peças danificadas no transporte de retorno',
      });
    });

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
