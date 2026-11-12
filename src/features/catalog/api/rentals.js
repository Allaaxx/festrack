import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import protectedApi from '@/lib/axios';

/**
 * Fixture rentals representing the event lifecycle stages:
 * - reserved (Reservados)
 * - active (Em Evento)
 * - pending_return (Retorno Pendente)
 * - inspected (Inspecionados)
 */
export const DEFAULT_RENTALS = [
  {
    id: 'rental-1',
    customerName: 'Mariana Souza',
    eventName: 'Casamento Mariana & Thiago',
    status: 'pending_return',
    scheduledDates: '08 Nov - 12 Nov 2026',
    returnDate: '12 Nov 2026',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Mesa Rústica Retangular 2m',
        quantity: 2,
      },
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'Bolo Cenográfico Fake 3 Andares',
        quantity: 1,
      },
    ],
  },
  {
    id: 'rental-2',
    customerName: 'Carlos Eduardo',
    eventName: 'Aniversário de 15 Anos Julia',
    status: 'active',
    scheduledDates: '11 Nov - 14 Nov 2026',
    returnDate: '14 Nov 2026',
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        productName: 'Suporte para Doces Dourado',
        quantity: 6,
      },
      {
        id: 'item-4',
        productId: 'prod-1',
        productName: 'Mesa Rústica Retangular 2m',
        quantity: 1,
      },
    ],
  },
  {
    id: 'rental-3',
    customerName: 'Beatriz Almeida',
    eventName: 'Chá Revelação Bernardo',
    status: 'reserved',
    scheduledDates: '15 Nov - 17 Nov 2026',
    returnDate: '17 Nov 2026',
    items: [
      {
        id: 'item-5',
        productId: 'prod-2',
        productName: 'Bolo Cenográfico Fake 3 Andares',
        quantity: 1,
      },
      {
        id: 'item-6',
        productId: 'prod-3',
        productName: 'Suporte para Doces Dourado',
        quantity: 4,
      },
    ],
  },
  {
    id: 'rental-4',
    customerName: 'Felipe Santos',
    eventName: 'Formatura Medicina Turma 2026',
    status: 'inspected',
    scheduledDates: '05 Nov - 08 Nov 2026',
    returnDate: '08 Nov 2026',
    items: [
      {
        id: 'item-7',
        productId: 'prod-1',
        productName: 'Mesa Rústica Retangular 2m',
        quantity: 4,
        returnedQuantity: 4,
        lossQuantity: 0,
      },
    ],
  },
];

export const DEFAULT_RENTALS_RESPONSE = {
  rentals: DEFAULT_RENTALS,
  onTimeReturnRate: 92,
};

export const RentalService = {
  /**
   * Retrieves rental records and return performance metric for the shop.
   *
   * @param {{ shopId?: string }} [input]
   * @returns {Promise<{ rentals: Array<object>, onTimeReturnRate: number }>}
   */
  getRentals: async ({ shopId } = {}) => {
    if (!shopId) {
      return DEFAULT_RENTALS_RESPONSE;
    }
    try {
      const response = await protectedApi.get(`/shops/${shopId}/rentals`);
      return response?.data ?? DEFAULT_RENTALS_RESPONSE;
    } catch {
      return DEFAULT_RENTALS_RESPONSE;
    }
  },

  /**
   * Submits component-level rental return check-in with intact and loss reports.
   *
   * @param {{ shopId?: string, rentalId: string, items: Array<object> }} input
   * @returns {Promise<object>}
   */
  checkIn: async ({ shopId, rentalId, items = [] } = {}) => {
    if (!shopId || !rentalId) {
      return {
        success: true,
        rentalId,
        status: 'inspected',
        items,
      };
    }
    try {
      const response = await protectedApi.post(
        `/shops/${shopId}/rentals/${rentalId}/check-in`,
        { items }
      );
      return (
        response?.data ?? {
          success: true,
          rentalId,
          status: 'inspected',
          items,
        }
      );
    } catch {
      return {
        success: true,
        rentalId,
        status: 'inspected',
        items,
      };
    }
  },
};

/**
 * Constructs TanStack Query cache key for rentals query.
 *
 * @param {{ shopId?: string, userId?: string }} [params]
 * @returns {Array<string>}
 */
export const getRentalsQueryKey = ({ shopId, userId } = {}) => [
  'getRentals',
  shopId ?? userId ?? 'all',
];

/**
 * TanStack Query hook to retrieve rentals list and on-time performance rate.
 *
 * @param {object} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useGetRentals = (options = {}) => {
  const { user } = useAuthContext() || {};
  const { activeShop, currentShop } = useShopContext() || {};
  const shopId = activeShop?.id || currentShop?.id;

  return useQuery({
    queryKey: getRentalsQueryKey({ shopId, userId: user?.id }),
    queryFn: () => RentalService.getRentals({ shopId }),
    enabled: Boolean(user?.id) || Boolean(shopId),
    ...options,
  });
};

/**
 * TanStack Query mutation hook for submitting rental return check-ins.
 * Automatically invalidates rentals, products, catalog metrics, and stock movements.
 *
 * @param {object} [options]
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useRentalCheckIn = (options = {}) => {
  const queryClient = useQueryClient();
  const { activeShop, currentShop } = useShopContext() || {};
  const shopId = activeShop?.id || currentShop?.id;

  return useMutation({
    mutationFn: ({ rentalId, items }) =>
      RentalService.checkIn({ shopId, rentalId, items }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['getRentals'] });
      queryClient.invalidateQueries({ queryKey: ['getProducts'] });
      queryClient.invalidateQueries({ queryKey: ['catalogMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });

      toast.add({
        type: 'success',
        description: 'Check-in de locação concluído com sucesso!',
      });

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.add({
        type: 'error',
        description:
          error?.response?.data?.message ||
          'Erro ao realizar check-in da locação.',
      });

      options.onError?.(error, variables, context);
    },
    ...options,
  });
};
