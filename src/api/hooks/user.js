import { useMutation } from '@tanstack/react-query';

import { UserService } from '@/api/services/user';

export const updateProfileMutationKey = ['updateProfile'];
export const uploadAvatarMutationKey = ['uploadAvatar'];

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
