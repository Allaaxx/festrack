import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useState } from 'react';

import { useSignIn, useSignUp } from '@/api/hooks/auth';
import { AuthService } from '@/api/services/auth';
import { toast } from '@/components/ui/toast';
import { normalizeUser } from '@/helpers/user';
import { authClient } from '@/lib/auth-client';

export const AuthContext = createContext({
  user: null,
  isInitializing: true,
  signin: () => {},
  signup: () => {},
  signout: () => {},
  signInWithGoogle: () => {},
  linkSocial: () => {},
  updateUser: () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const { data: sessionData, isPending } = authClient.useSession();
  const [overrideUser, setOverrideUser] = useState(undefined);
  const queryClient = useQueryClient();

  const signUpMutation = useSignUp();
  const signInMutation = useSignIn();

  const user =
    overrideUser !== undefined
      ? overrideUser
      : normalizeUser(sessionData?.user);

  const updateUser = (updatedUserData) => {
    const normalized = normalizeUser(updatedUserData);
    setOverrideUser(normalized);
    try {
      if (typeof authClient?.getSession === 'function') {
        const sessionPromise = authClient.getSession();
        if (sessionPromise && typeof sessionPromise.catch === 'function') {
          sessionPromise.catch(() => {});
        }
      }
    } catch {
      // Ignora falhas de sincronização em segundo plano
    }
    return normalized;
  };

  const signup = async (data) => {
    try {
      const createdUser = await signUpMutation.mutateAsync(data);
      const normalized = normalizeUser(createdUser);
      setOverrideUser(normalized);
      toast.add({
        type: 'success',
        title: 'Conta criada com sucesso!',
        description: 'Seja bem vindo.',
      });
      return createdUser;
    } catch (error) {
      console.error(error);
      toast.add({
        type: 'error',
        title: 'Erro ao criar conta!',
        description: error?.message || 'Por favor, tente mais tarde.',
      });
      throw error;
    }
  };

  const signin = async (data) => {
    try {
      const loggedUser = await signInMutation.mutateAsync(data);
      const normalized = normalizeUser(loggedUser);
      setOverrideUser(normalized);
      toast.add({
        type: 'success',
        title: 'Logado com sucesso!',
        description: 'É bom vê-lo novamente.',
      });
      return loggedUser;
    } catch (error) {
      console.error(error);
      toast.add({
        type: 'error',
        title: 'Erro ao realizar o login!',
        description: error?.message || 'Por favor, verifique suas credenciais.',
      });
      throw error;
    }
  };

  const signInWithGoogle = async (options = {}) => {
    try {
      return await AuthService.signInWithGoogle(options);
    } catch (error) {
      console.error(error);
      toast.add({
        type: 'error',
        title: 'Erro ao autenticar com Google!',
        description: error?.message || 'Por favor, tente novamente.',
      });
      throw error;
    }
  };

  const linkSocial = async (options = {}) => {
    try {
      return await AuthService.linkSocial(options);
    } catch (error) {
      console.error(error);
      toast.add({
        type: 'error',
        title: 'Erro ao conectar conta!',
        description: error?.message || 'Por favor, tente novamente.',
      });
      throw error;
    }
  };

  const signout = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error(error);
    } finally {
      setOverrideUser(null);
      queryClient.clear();
    }
  };

  const isInitializing = isPending && !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isInitializing,
        signin,
        signup,
        signout,
        signInWithGoogle,
        linkSocial,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
