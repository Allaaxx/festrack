import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getAccountsQueryKey } from '@/api/hooks/user';
import { AuthService } from '@/api/services/auth';
import { useAuthContext } from '@/contexts/auth';

export const signupMutationKey = ['signup'];
export const signinMutationKey = ['signin'];
export const setPasswordMutationKey = ['setPassword'];
export const changePasswordMutationKey = ['changePassword'];

export const useSignUp = () => {
  return useMutation({
    mutationKey: signupMutationKey,
    mutationFn: async (variables) => {
      const response = await AuthService.signup(variables);
      return response;
    },
  });
};

export const useSignIn = () => {
  return useMutation({
    mutationKey: signinMutationKey,
    mutationFn: async (variables) => {
      const response = await AuthService.signin(variables);
      return response;
    },
  });
};

export const useSetPassword = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationKey: setPasswordMutationKey,
    mutationFn: async (variables) => {
      return await AuthService.setPassword(variables);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: getAccountsQueryKey({ userId: user.id }),
        });
      }
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationKey: changePasswordMutationKey,
    mutationFn: async (variables) => {
      return await AuthService.changePassword(variables);
    },
  });
};
