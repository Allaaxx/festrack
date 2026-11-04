import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { ShopContextProvider, useShopContext } from '@/contexts/shop';
import ShopService from '@/features/shops/api/services';
import CreateShopDialog from '@/features/shops/components/create-shop-dialog';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/features/shops/api/services', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const ActiveShopIndicator = () => {
  const { activeShop, role } = useShopContext();
  return (
    <div data-testid="active-shop-indicator">
      {activeShop ? `${activeShop.name} (${role})` : 'Nenhuma loja'}
    </div>
  );
};

describe('CreateShopDialog', () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useAuthContext.mockReturnValue({
      user: { id: 'user-1', email: 'maria@example.com' },
      isInitializing: false,
    });
    ShopService.getAll.mockResolvedValue([
      {
        id: 'shop-1',
        name: 'Loja Inicial',
        description: null,
        role: 'OWNER',
      },
    ]);
  });

  const renderDialog = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ShopContextProvider>
          <ActiveShopIndicator />
          <CreateShopDialog open={true} onOpenChange={vi.fn()} {...props} />
        </ShopContextProvider>
      </QueryClientProvider>
    );
  };

  it('validates that shop name is required before calling ShopService.create', async () => {
    const user = userEvent.setup();
    renderDialog();

    const submitButton = screen.getByRole('button', { name: /criar loja/i });
    await user.click(submitButton);

    expect(
      await screen.findByText(/o nome da loja é obrigatório/i)
    ).toBeInTheDocument();
    expect(ShopService.create).not.toHaveBeenCalled();
  });

  it('creates a shop, sets it as the active shop, persists to localStorage, shows toast, and closes dialog', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const createdShop = {
      id: 'shop-new',
      name: 'Loja Centro',
      description: 'Unidade matriz',
      role: 'OWNER',
    };
    ShopService.create.mockResolvedValue(createdShop);

    renderDialog({ onOpenChange });

    await waitFor(() => {
      expect(screen.getByTestId('active-shop-indicator')).toHaveTextContent(
        'Loja Inicial (OWNER)'
      );
    });

    await user.type(screen.getByLabelText(/nome da loja/i), 'Loja Centro');
    await user.type(screen.getByLabelText(/descrição/i), 'Unidade matriz');
    await user.click(screen.getByRole('button', { name: /criar loja/i }));

    await waitFor(() => {
      expect(ShopService.create).toHaveBeenCalledWith({
        name: 'Loja Centro',
        description: 'Unidade matriz',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('active-shop-indicator')).toHaveTextContent(
        'Loja Centro (OWNER)'
      );
    });

    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe(
      'shop-new'
    );
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: expect.stringMatching(/loja criada com sucesso/i),
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows error toast and keeps dialog open when shop creation fails', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    ShopService.create.mockRejectedValue(new Error('Falha no servidor'));

    renderDialog({ onOpenChange });

    await user.type(screen.getByLabelText(/nome da loja/i), 'Loja Com Erro');
    await user.click(screen.getByRole('button', { name: /criar loja/i }));

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: expect.stringMatching(/não foi possível criar a loja/i),
        })
      );
    });

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('enforces blocking onboarding mode when isOnboarding is true', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    ShopService.getAll.mockResolvedValue([]);

    renderDialog({ isOnboarding: true, onOpenChange });

    expect(
      screen.getByRole('heading', { name: /crie sua primeira loja/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cancelar/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /close/i })
    ).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
