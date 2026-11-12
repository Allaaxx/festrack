import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  DEFAULT_RENTALS_RESPONSE,
  getRentalsQueryKey,
  RentalService,
  useGetRentals,
  useRentalCheckIn,
} from '@/features/catalog/api/rentals';
import protectedApi from '@/lib/axios';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('Rental API and Services (#116)', () => {
  let queryClient;
  const shopId = 'shop-123';
  const mockUser = { id: 'user-1', name: 'Ana Lojista' };

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({ user: mockUser });
    useShopContext.mockReturnValue({
      activeShop: { id: shopId, name: 'Festas Encantadas' },
    });
  });

  describe('RentalService', () => {
    describe('getRentals', () => {
      it('fetches rentals from the API when available', async () => {
        const mockResponse = {
          rentals: [
            {
              id: 'rental-test',
              customerName: 'Cliente Teste',
              eventName: 'Festa Teste',
              status: 'pending_return',
              scheduledDates: '10 Nov - 12 Nov 2026',
              items: [{ id: 'item-1', productName: 'Mesa', quantity: 2 }],
            },
          ],
          onTimeReturnRate: 95,
        };

        protectedApi.get.mockResolvedValueOnce({ data: mockResponse });

        const result = await RentalService.getRentals({ shopId });

        expect(protectedApi.get).toHaveBeenCalledWith(
          `/shops/${shopId}/rentals`
        );
        expect(result).toEqual(mockResponse);
      });

      it('falls back to default fixtures when API returns error', async () => {
        protectedApi.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await RentalService.getRentals({ shopId });

        expect(result).toEqual(DEFAULT_RENTALS_RESPONSE);
      });

      it('returns fixtures when shopId is not provided', async () => {
        const result = await RentalService.getRentals();
        expect(result).toEqual(DEFAULT_RENTALS_RESPONSE);
        expect(protectedApi.get).not.toHaveBeenCalled();
      });
    });

    describe('checkIn', () => {
      it('posts check-in payload to the API and returns result', async () => {
        const rentalId = 'rental-1';
        const items = [
          {
            id: 'item-1',
            productId: 'prod-1',
            returnedQuantity: 2,
            lossQuantity: 0,
            lossNote: '',
          },
        ];

        const mockApiResponse = {
          success: true,
          rentalId,
          status: 'inspected',
        };

        protectedApi.post.mockResolvedValueOnce({ data: mockApiResponse });

        const result = await RentalService.checkIn({
          shopId,
          rentalId,
          items,
        });

        expect(protectedApi.post).toHaveBeenCalledWith(
          `/shops/${shopId}/rentals/${rentalId}/check-in`,
          { items }
        );
        expect(result).toEqual(mockApiResponse);
      });

      it('falls back gracefully to simulated inspected rental when API fails', async () => {
        const rentalId = 'rental-1';
        const items = [
          {
            id: 'item-1',
            productId: 'prod-1',
            returnedQuantity: 1,
            lossQuantity: 1,
            lossNote: 'Vidro quebrado',
          },
        ];

        protectedApi.post.mockRejectedValueOnce(new Error('Offline'));

        const result = await RentalService.checkIn({
          shopId,
          rentalId,
          items,
        });

        expect(result).toEqual({
          success: true,
          rentalId,
          status: 'inspected',
          items,
        });
      });
    });
  });

  describe('useGetRentals hook', () => {
    it('fetches rentals using query key and RentalService', async () => {
      protectedApi.get.mockResolvedValueOnce({ data: DEFAULT_RENTALS_RESPONSE });

      const { result } = renderHook(() => useGetRentals(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(DEFAULT_RENTALS_RESPONSE);
    });

    it('generates consistent getRentalsQueryKey', () => {
      expect(getRentalsQueryKey({ shopId: 'shop-1' })).toEqual([
        'getRentals',
        'shop-1',
      ]);
      expect(getRentalsQueryKey({ userId: 'user-1' })).toEqual([
        'getRentals',
        'user-1',
      ]);
      expect(getRentalsQueryKey()).toEqual(['getRentals', 'all']);
    });
  });

  describe('useRentalCheckIn hook', () => {
    it('invalidates queries and triggers success toast on check-in completion', async () => {
      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      protectedApi.post.mockResolvedValueOnce({
        data: { success: true, rentalId: 'rental-1', status: 'inspected' },
      });

      const { result } = renderHook(() => useRentalCheckIn(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          rentalId: 'rental-1',
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              returnedQuantity: 2,
              lossQuantity: 0,
              lossNote: '',
            },
          ],
        });
      });

      // Verify queries invalidated: getRentals, getProducts, catalogMetrics, stockMovements
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['getRentals'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['getProducts'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['catalogMetrics'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['stockMovements'],
      });

      // Verify toast
      expect(toast.add).toHaveBeenCalledWith({
        type: 'success',
        description: 'Check-in de locação concluído com sucesso!',
      });
    });
  });
});
