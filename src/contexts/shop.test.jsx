import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { ShopContextProvider, useShopContext } from '@/contexts/shop';
import ShopService from '@/features/shops/api/services';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
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

const createWrapper = (queryClient) => {
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ShopContextProvider>{children}</ShopContextProvider>
    </QueryClientProvider>
  );
};

describe('ShopContext', () => {
  let queryClient;

  const mockShops = [
    {
      id: 'shop-1',
      name: 'Atelier Central',
      description: 'Matriz',
      role: 'OWNER',
    },
    {
      id: 'shop-2',
      name: 'Buffet Jardim',
      description: 'Filial',
      role: 'MEMBER',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    useAuthContext.mockReturnValue({
      user: { id: 'user-1', email: 'maria@example.com' },
      isInitializing: false,
    });
  });

  it('fetches user shops, defaults activeShop to the first shop, exposes role, and persists ID in localStorage', async () => {
    ShopService.getAll.mockResolvedValue(mockShops);

    const { result } = renderHook(() => useShopContext(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.shops).toEqual(mockShops);
    });

    expect(result.current.activeShop).toEqual(mockShops[0]);
    expect(result.current.role).toBe('OWNER');
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-1');
  });

  it('restores activeShop from localStorage when stored ID matches an available shop', async () => {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY, 'shop-2');
    ShopService.getAll.mockResolvedValue(mockShops);

    const { result } = renderHook(() => useShopContext(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeShop).toEqual(mockShops[1]);
    });

    expect(result.current.role).toBe('MEMBER');
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-2');
  });

  it('falls back to the first shop when stored ID in localStorage does not match any user shop', async () => {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY, 'non-existent-shop');
    ShopService.getAll.mockResolvedValue(mockShops);

    const { result } = renderHook(() => useShopContext(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeShop).toEqual(mockShops[0]);
    });

    expect(result.current.role).toBe('OWNER');
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-1');
  });

  it('updates activeShop, persists to localStorage, and invalidates queries when setActiveShop is called with ID or object', async () => {
    ShopService.getAll.mockResolvedValue(mockShops);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useShopContext(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.activeShop?.id).toBe('shop-1');
    });

    act(() => {
      result.current.setActiveShop('shop-2');
    });

    expect(result.current.activeShop).toEqual(mockShops[1]);
    expect(result.current.role).toBe('MEMBER');
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-2');
    expect(invalidateSpy).toHaveBeenCalled();

    invalidateSpy.mockClear();

    act(() => {
      result.current.setActiveShop(mockShops[0]);
    });

    expect(result.current.activeShop).toEqual(mockShops[0]);
    expect(result.current.role).toBe('OWNER');
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-1');
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
