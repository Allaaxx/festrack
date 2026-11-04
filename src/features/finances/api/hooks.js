import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  BalanceService,
  TransactionService,
} from '@/features/finances/api/services';

export const getUserBalanceQueryKey = ({ userId, shopId, from, to } = {}) => {
  if (!from || !to) {
    return ['balance', userId, shopId];
  }
  return ['balance', userId, shopId, from, to];
};

export const useGetUserBalance = ({ from, to } = {}) => {
  const { user } = useAuthContext();
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;
  return useQuery({
    queryKey: getUserBalanceQueryKey({ userId: user?.id, shopId, from, to }),
    queryFn: () => BalanceService.getBalance({ shopId, from, to }),
    staleTime: 1000 * 60 * 5,
    enabled:
      Boolean(from) && Boolean(to) && Boolean(user?.id) && Boolean(shopId),
  });
};

export const getTransactionsQueryKey = ({
  userId,
  shopId,
  from,
  to,
  eventId,
} = {}) => {
  if (eventId) {
    return ['getTransactions', userId, shopId, { eventId }];
  }
  if (!from || !to) {
    return ['getTransactions', userId, shopId];
  }
  return ['getTransactions', userId, shopId, from, to];
};

export const useGetTransactions = ({ from, to, eventId } = {}) => {
  const { user } = useAuthContext();
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;
  return useQuery({
    queryKey: getTransactionsQueryKey({
      userId: user?.id,
      shopId,
      from,
      to,
      eventId,
    }),
    queryFn: () => {
      const input = { shopId };
      if (from) input.from = from;
      if (to) input.to = to;
      if (eventId) input.eventId = eventId;
      return TransactionService.getAll(input);
    },
    enabled:
      Boolean(user?.id) &&
      Boolean(shopId) &&
      (Boolean(eventId) || (Boolean(from) && Boolean(to))),
  });
};

export const createTransactionMutationKey = ['createTransaction'];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;
  return useMutation({
    mutationKey: createTransactionMutationKey,
    mutationFn: (input) =>
      TransactionService.create({
        ...input,
        shopId: input?.shopId ?? shopId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUserBalanceQueryKey({
          userId: user?.id,
          shopId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getTransactionsQueryKey({
          userId: user?.id,
          shopId,
        }),
      });
    },
  });
};

export const editTransactionMutationKey = ['editTransaction'];

export const useEditTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;
  return useMutation({
    mutationKey: editTransactionMutationKey,
    mutationFn: (input) =>
      TransactionService.update({
        ...input,
        shopId: input?.shopId ?? shopId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUserBalanceQueryKey({
          userId: user?.id,
          shopId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getTransactionsQueryKey({
          userId: user?.id,
          shopId,
        }),
      });
    },
  });
};

export const deleteTransactionMutationKey = ['deleteTransaction'];

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;
  return useMutation({
    mutationKey: deleteTransactionMutationKey,
    mutationFn: (input) => {
      const payload =
        typeof input === 'string'
          ? { id: input, shopId }
          : { ...input, shopId: input?.shopId ?? shopId };
      return TransactionService.delete(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUserBalanceQueryKey({
          userId: user?.id,
          shopId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getTransactionsQueryKey({
          userId: user?.id,
          shopId,
        }),
      });
    },
  });
};
