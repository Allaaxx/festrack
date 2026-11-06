import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LOCAL_STORAGE_ACTIVE_SHOP_KEY } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';
import { ShopContextProvider, useShopContext } from '@/contexts/shop';
import {
  ShopService,
  useCreateShopInvitation,
  useDeleteShop,
  useGetShopInvitations,
  useGetShopMembers,
  useRemoveShopMember,
  useRevokeShopInvitation,
  useTransferShopOwnership,
} from '@/features/shops';

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
    getMembers: vi.fn(),
    removeMember: vi.fn(),
    transferOwnership: vi.fn(),
    getInvitations: vi.fn(),
    createInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
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

  it('automatically falls back to the next shop when the active shop is deleted or left, and clears activeShop when none remain', async () => {
    ShopService.getAll.mockResolvedValue(mockShops);
    ShopService.delete.mockResolvedValue({ id: 'shop-1' });
    ShopService.removeMember.mockResolvedValue({
      id: 'member-2',
      shop_id: 'shop-2',
      user_id: 'user-1',
    });

    const { result } = renderHook(
      () => ({
        context: useShopContext(),
        deleteShop: useDeleteShop(),
        removeMember: useRemoveShopMember(),
      }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await waitFor(() => {
      expect(result.current.context.activeShop?.id).toBe('shop-1');
    });

    await act(async () => {
      await result.current.deleteShop.mutateAsync({ shopId: 'shop-1' });
    });

    await waitFor(() => {
      expect(result.current.context.activeShop?.id).toBe('shop-2');
      expect(result.current.context.role).toBe('MEMBER');
    });
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBe('shop-2');

    await act(async () => {
      await result.current.removeMember.mutateAsync({
        shopId: 'shop-2',
        userId: 'user-1',
      });
    });

    await waitFor(() => {
      expect(result.current.context.shops).toEqual([]);
      expect(result.current.context.activeShop).toBeNull();
    });
    expect(localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY)).toBeNull();
  });

  it('fetches members, invitations, creates and revokes invitations, and updates role to MEMBER on ownership transfer', async () => {
    ShopService.getAll.mockResolvedValue(mockShops);
    ShopService.getMembers.mockResolvedValue([
      {
        id: 'm1',
        shop_id: 'shop-1',
        user_id: 'user-1',
        role: 'OWNER',
        user: { id: 'user-1', name: 'Maria', email: 'maria@example.com' },
      },
      {
        id: 'm2',
        shop_id: 'shop-1',
        user_id: 'user-2',
        role: 'MEMBER',
        user: { id: 'user-2', name: 'João', email: 'joao@example.com' },
      },
    ]);
    ShopService.getInvitations.mockResolvedValue([
      {
        id: 'inv-1',
        shop_id: 'shop-1',
        email: 'ana@example.com',
        role: 'MEMBER',
        token: 'tok-1',
        status: 'PENDING',
      },
    ]);
    ShopService.createInvitation.mockResolvedValue({
      id: 'inv-2',
      shop_id: 'shop-1',
      email: 'pedro@example.com',
      role: 'MEMBER',
      token: 'tok-2',
      status: 'PENDING',
    });
    ShopService.revokeInvitation.mockResolvedValue({
      id: 'inv-1',
      shop_id: 'shop-1',
      status: 'REVOKED',
    });
    ShopService.transferOwnership.mockResolvedValue({
      id: 'm2',
      shop_id: 'shop-1',
      user_id: 'user-2',
      role: 'OWNER',
    });

    const { result } = renderHook(
      () => ({
        context: useShopContext(),
        membersQuery: useGetShopMembers(),
        invitationsQuery: useGetShopInvitations(),
        createInvitation: useCreateShopInvitation(),
        revokeInvitation: useRevokeShopInvitation(),
        transferOwnership: useTransferShopOwnership(),
      }),
      {
        wrapper: createWrapper(queryClient),
      }
    );

    await waitFor(() => {
      expect(result.current.membersQuery.data).toHaveLength(2);
      expect(result.current.invitationsQuery.data).toHaveLength(1);
    });

    await act(async () => {
      await result.current.createInvitation.mutateAsync({
        shopId: 'shop-1',
        email: 'pedro@example.com',
        role: 'MEMBER',
      });
    });

    expect(ShopService.createInvitation).toHaveBeenCalledWith({
      shopId: 'shop-1',
      email: 'pedro@example.com',
      role: 'MEMBER',
    });

    await act(async () => {
      await result.current.revokeInvitation.mutateAsync({
        shopId: 'shop-1',
        invitationId: 'inv-1',
      });
    });

    expect(ShopService.revokeInvitation).toHaveBeenCalledWith({
      shopId: 'shop-1',
      invitationId: 'inv-1',
    });

    await act(async () => {
      await result.current.transferOwnership.mutateAsync({
        shopId: 'shop-1',
        newOwnerUserId: 'user-2',
      });
    });

    await waitFor(() => {
      expect(result.current.context.role).toBe('MEMBER');
      expect(result.current.context.activeShop?.role).toBe('MEMBER');
    });
  });
});
