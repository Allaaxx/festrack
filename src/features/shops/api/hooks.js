import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
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
  const { activeShop, updateShop } = useShopContext();
  return useMutation({
    mutationKey: editShopMutationKey,
    mutationFn: (input) =>
      ShopService.update({
        ...input,
        shopId: input?.shopId ?? input?.id ?? activeShop?.id,
      }),
    onSuccess: (updatedShop, variables) => {
      const shopId =
        variables?.shopId ?? variables?.id ?? updatedShop?.id ?? activeShop?.id;
      if (shopId) {
        updateShop?.({
          id: shopId,
          ...(variables?.name !== undefined ? { name: variables.name } : {}),
          ...(variables?.description !== undefined
            ? { description: variables.description }
            : {}),
          ...(updatedShop || {}),
        });
        queryClient.invalidateQueries({
          queryKey: getShopQueryKey({ shopId }),
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['getShops'],
      });
    },
  });
};

export const deleteShopMutationKey = ['deleteShop'];

export const useDeleteShop = () => {
  const queryClient = useQueryClient();
  const { shops, activeShop, setActiveShop, removeShop } = useShopContext();
  return useMutation({
    mutationKey: deleteShopMutationKey,
    mutationFn: (input) => {
      const shopId =
        typeof input === 'string'
          ? input
          : (input?.shopId ?? input?.id ?? activeShop?.id);
      return ShopService.delete({ shopId });
    },
    onSuccess: (_data, variables) => {
      const shopId =
        typeof variables === 'string'
          ? variables
          : (variables?.shopId ?? variables?.id ?? activeShop?.id);
      if (shopId) {
        const remainingShops = Array.isArray(shops)
          ? shops.filter((s) => s.id !== shopId)
          : [];
        removeShop?.(shopId);
        if (remainingShops.length > 0 && activeShop?.id === shopId) {
          setActiveShop?.(remainingShops[0]);
        }
      }
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

export const getShopMembersQueryKey = ({ shopId } = {}) => [
  'getShopMembers',
  shopId,
];

export const useGetShopMembers = ({ shopId: propShopId } = {}) => {
  const { user } = useAuthContext();
  const { activeShop } = useShopContext();
  const shopId = propShopId ?? activeShop?.id;
  return useQuery({
    queryKey: getShopMembersQueryKey({ shopId }),
    queryFn: () => ShopService.getMembers({ shopId }),
    enabled: Boolean(user?.id) && Boolean(shopId),
  });
};

export const removeShopMemberMutationKey = ['removeShopMember'];

export const useRemoveShopMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { shops, activeShop, setActiveShop, removeShop } = useShopContext();
  return useMutation({
    mutationKey: removeShopMemberMutationKey,
    mutationFn: (input) =>
      ShopService.removeMember({
        ...input,
        shopId: input?.shopId ?? input?.id ?? activeShop?.id,
      }),
    onSuccess: (_data, variables) => {
      const shopId = variables?.shopId ?? variables?.id ?? activeShop?.id;
      const targetUserId =
        variables?.userId ?? variables?.memberUserId ?? variables?.memberId;

      if (shopId) {
        queryClient.setQueryData(
          getShopMembersQueryKey({ shopId }),
          (previous) => {
            if (!Array.isArray(previous)) return previous;
            return previous.filter(
              (member) =>
                (member.user_id ??
                  member.userId ??
                  member.user?.id ??
                  member.id) !== targetUserId
            );
          }
        );
        queryClient.invalidateQueries({
          queryKey: getShopMembersQueryKey({ shopId }),
        });
      }

      if (shopId && targetUserId && user?.id && targetUserId === user.id) {
        const remainingShops = Array.isArray(shops)
          ? shops.filter((s) => s.id !== shopId)
          : [];
        removeShop?.(shopId);
        if (remainingShops.length > 0 && activeShop?.id === shopId) {
          setActiveShop?.(remainingShops[0]);
        }
        queryClient.invalidateQueries({
          queryKey: ['getShops'],
        });
      }
    },
  });
};

export const transferShopOwnershipMutationKey = ['transferShopOwnership'];

export const useTransferShopOwnership = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { activeShop, updateShop } = useShopContext();
  return useMutation({
    mutationKey: transferShopOwnershipMutationKey,
    mutationFn: (input) =>
      ShopService.transferOwnership({
        ...input,
        shopId: input?.shopId ?? input?.id ?? activeShop?.id,
      }),
    onSuccess: (_data, variables) => {
      const shopId = variables?.shopId ?? variables?.id ?? activeShop?.id;
      const newOwnerUserId =
        variables?.newOwnerUserId ??
        variables?.new_owner_user_id ??
        variables?.userId;

      if (shopId) {
        updateShop?.({ id: shopId, role: 'MEMBER' });
        queryClient.setQueryData(
          getShopMembersQueryKey({ shopId }),
          (previous) => {
            if (!Array.isArray(previous)) return previous;
            return previous.map((member) => {
              const memberUserId =
                member.user_id ?? member.userId ?? member.user?.id ?? member.id;
              if (memberUserId === newOwnerUserId) {
                return { ...member, role: 'OWNER' };
              }
              if (user?.id && memberUserId === user.id) {
                return { ...member, role: 'MEMBER' };
              }
              return member;
            });
          }
        );
        queryClient.invalidateQueries({
          queryKey: getShopMembersQueryKey({ shopId }),
        });
        queryClient.invalidateQueries({
          queryKey: getShopQueryKey({ shopId }),
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['getShops'],
      });
    },
  });
};

export const getShopInvitationsQueryKey = ({ shopId } = {}) => [
  'getShopInvitations',
  shopId,
];

export const useGetShopInvitations = ({
  shopId: propShopId,
  enabled: propEnabled,
} = {}) => {
  const { user } = useAuthContext();
  const { activeShop, role } = useShopContext();
  const shopId = propShopId ?? activeShop?.id;
  const effectiveRole = activeShop?.role ?? role;
  const canFetchByRole = effectiveRole
    ? effectiveRole === 'OWNER'
    : Boolean(propShopId);

  return useQuery({
    queryKey: getShopInvitationsQueryKey({ shopId }),
    queryFn: () => ShopService.getInvitations({ shopId }),
    enabled:
      propEnabled !== undefined
        ? Boolean(propEnabled) && Boolean(shopId)
        : Boolean(user?.id) && Boolean(shopId) && canFetchByRole,
  });
};

export const createShopInvitationMutationKey = ['createShopInvitation'];

export const useCreateShopInvitation = () => {
  const queryClient = useQueryClient();
  const { activeShop } = useShopContext();
  return useMutation({
    mutationKey: createShopInvitationMutationKey,
    mutationFn: (input) =>
      ShopService.createInvitation({
        ...input,
        shopId: input?.shopId ?? input?.id ?? activeShop?.id,
      }),
    onSuccess: (createdInvitation, variables) => {
      const shopId =
        variables?.shopId ??
        variables?.id ??
        createdInvitation?.shop_id ??
        activeShop?.id;
      if (shopId) {
        if (createdInvitation) {
          queryClient.setQueryData(
            getShopInvitationsQueryKey({ shopId }),
            (previous = []) => {
              if (!Array.isArray(previous)) return [createdInvitation];
              const filtered = previous.filter(
                (inv) =>
                  inv.id !== createdInvitation.id &&
                  inv.email?.toLowerCase() !==
                    createdInvitation.email?.toLowerCase()
              );
              return [...filtered, createdInvitation];
            }
          );
        }
        queryClient.invalidateQueries({
          queryKey: getShopInvitationsQueryKey({ shopId }),
        });
      }
    },
  });
};

export const revokeShopInvitationMutationKey = ['revokeShopInvitation'];

export const useRevokeShopInvitation = () => {
  const queryClient = useQueryClient();
  const { activeShop } = useShopContext();
  return useMutation({
    mutationKey: revokeShopInvitationMutationKey,
    mutationFn: (input) =>
      ShopService.revokeInvitation({
        ...input,
        shopId: input?.shopId ?? activeShop?.id,
      }),
    onSuccess: (_data, variables) => {
      const shopId = variables?.shopId ?? activeShop?.id;
      const invitationId = variables?.invitationId ?? variables?.id;
      if (shopId) {
        queryClient.setQueryData(
          getShopInvitationsQueryKey({ shopId }),
          (previous) => {
            if (!Array.isArray(previous)) return previous;
            return previous.filter((inv) => inv.id !== invitationId);
          }
        );
        queryClient.invalidateQueries({
          queryKey: getShopInvitationsQueryKey({ shopId }),
        });
      }
    },
  });
};
