import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import {
  BalanceService,
  TransactionService,
} from '@/features/transactions/api/services';

export const getUserBalanceQueryKey = ({ userId, from, to }) => {
  if (!from || !to) {
    return ['balance', userId];
  }
  return ['balance', userId, from, to];
};

export const useGetUserBalance = ({ from, to }) => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getUserBalanceQueryKey({ userId: user?.id, from, to }),
    queryFn: () => BalanceService.getBalance({ from, to }),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(from) && Boolean(to) && Boolean(user?.id),
  });
};

export const getTransactionsQueryKey = ({ userId, from, to, eventId }) => {
  if (eventId) {
    return ['getTransactions', userId, { eventId }];
  }
  if (!from || !to) {
    return ['getTransactions', userId];
  }
  return ['getTransactions', userId, from, to];
};

export const useGetTransactions = ({ from, to, eventId } = {}) => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getTransactionsQueryKey({ userId: user?.id, from, to, eventId }),
    queryFn: () => {
      const input = {};
      if (from) input.from = from;
      if (to) input.to = to;
      if (eventId) input.eventId = eventId;
      return TransactionService.getAll(input);
    },
    enabled:
      Boolean(user?.id) &&
      (Boolean(eventId) || (Boolean(from) && Boolean(to))),
  });
};

export const createTransactionMutationKey = ['createTransaction'];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: createTransactionMutationKey,
    mutationFn: (input) => TransactionService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUserBalanceQueryKey({
          userId: user?.id,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getTransactionsQueryKey({ userId: user?.id }),
      });
    },
  });
};

export const editTransactionMutationKey = ['editTransaction'];

export const useEditTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: editTransactionMutationKey,
    mutationFn: (input) => TransactionService.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUserBalanceQueryKey({
          userId: user?.id,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getTransactionsQueryKey({ userId: user?.id }),
      });
    },
  });
};

export const deleteTransactionMutationKey = ['deleteTransaction'];

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: deleteTransactionMutationKey,
    mutationFn: (input) => TransactionService.delete(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUserBalanceQueryKey({
          userId: user?.id,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getTransactionsQueryKey({ userId: user?.id }),
      });
    },
  });
};
