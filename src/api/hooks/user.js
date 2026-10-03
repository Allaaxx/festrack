import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { UserService } from '@/api/services/user';
import { useAuthContext } from '@/contexts/auth';

export const updateProfileMutationKey = ['updateProfile'];
export const uploadAvatarMutationKey = ['uploadAvatar'];
export const getAccountsQueryKey = ({ userId }) => ['getAccounts', userId];
export const unlinkAccountMutationKey = ['unlinkAccount'];

export const useUpdateProfile = () => {
  return useMutation({
    mutationKey: updateProfileMutationKey,
    mutationFn: async (variables) => {
      return await UserService.updateProfile(variables);
    },
  });
};

export const useUploadAvatar = () => {
  return useMutation({
    mutationKey: uploadAvatarMutationKey,
    mutationFn: async (file) => {
      return await UserService.uploadAvatar(file);
    },
  });
};

export const useGetAccounts = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getAccountsQueryKey({ userId: user?.id }),
    queryFn: () => UserService.getAccounts(),
    enabled: Boolean(user?.id),
  });
};

export const useUnlinkAccount = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: unlinkAccountMutationKey,
    mutationFn: async (variables) => {
      return await UserService.unlinkAccount(variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getAccountsQueryKey({ userId: user?.id }),
      });
    },
  });
};
