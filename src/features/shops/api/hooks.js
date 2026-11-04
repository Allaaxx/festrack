import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import ShopService from '@/features/shops/api/services';

export const getShopsQueryKey = ({ userId } = {}) =>
  userId ? ['getShops', userId] : ['getShops'];

export const useGetShops = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getShopsQueryKey({ userId: user?.id }),
    queryFn: () => ShopService.getAll(),
    enabled: Boolean(user?.id),
  });
};

export const getShopQueryKey = ({ shopId } = {}) => ['getShop', shopId];

export const useGetShop = ({ shopId } = {}) => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getShopQueryKey({ shopId }),
    queryFn: () => ShopService.getById(shopId),
    enabled: Boolean(user?.id) && Boolean(shopId),
  });
};

export const createShopMutationKey = ['createShop'];

export const useCreateShop = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: createShopMutationKey,
    mutationFn: (input) => ShopService.create(input),
    onSuccess: (createdShop) => {
      const queryKey = getShopsQueryKey({ userId: user?.id });
      queryClient.setQueryData(queryKey, (previous = []) => {
        if (!Array.isArray(previous)) return [createdShop];
        const exists = previous.some((shop) => shop.id === createdShop?.id);
        return exists ? previous : [...previous, createdShop];
      });
      queryClient.invalidateQueries({
        queryKey: ['getShops'],
      });
    },
  });
};

export const editShopMutationKey = ['editShop'];

export const useEditShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: editShopMutationKey,
    mutationFn: (input) => ShopService.update(input),
    onSuccess: (_data, variables) => {
      const shopId = variables?.shopId ?? variables?.id;
      queryClient.invalidateQueries({
        queryKey: ['getShops'],
      });
      if (shopId) {
        queryClient.invalidateQueries({
          queryKey: getShopQueryKey({ shopId }),
        });
      }
    },
  });
};

export const deleteShopMutationKey = ['deleteShop'];

export const useDeleteShop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: deleteShopMutationKey,
    mutationFn: (input) => ShopService.delete(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['getShops'],
      });
    },
  });
};

export const getInvitationByTokenQueryKey = (input = {}) => {
  const token = typeof input === 'string' ? input : input?.token;
  return ['getInvitationByToken', token];
};

export const useGetInvitationByToken = (input) => {
  const token = typeof input === 'string' ? input : input?.token;
  return useQuery({
    queryKey: getInvitationByTokenQueryKey({ token }),
    queryFn: () => ShopService.getInvitationByToken(token),
    enabled: Boolean(token),
    retry: false,
  });
};

export const acceptInvitationMutationKey = ['acceptShopInvitation'];
export const acceptShopInvitationMutationKey = acceptInvitationMutationKey;

export const useAcceptShopInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: acceptInvitationMutationKey,
    mutationFn: (input) => ShopService.acceptInvitation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['getShops'],
      });
    },
  });
};

export const useAcceptInvitation = useAcceptShopInvitation;
