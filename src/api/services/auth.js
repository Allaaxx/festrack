import { normalizeUser } from '@/helpers/user';
import { authClient } from '@/lib/auth-client';
import protectedApi from '@/lib/axios';

export const AuthService = {
  /**
   * Cria um novo usuário via Better Auth.
   * @param {object} input - Usuário a ser criado.
   * @param {string} input.firstName - Primeiro nome do usuário.
   * @param {string} input.lastName - Sobrenome do usuário.
   * @param {string} input.email - E-mail do usuário.
   * @param {string} input.password - Senha do usuário.
   * @returns {Promise<object>} Usuário criado normalizado.
   */
  signup: async (input) => {
    const firstName = input.firstName || input.first_name || '';
    const lastName = input.lastName || input.last_name || '';
    const name = `${firstName} ${lastName}`.trim();

    const response = await authClient.signUp.email({
      email: input.email,
      password: input.password,
      name,
      first_name: firstName,
      last_name: lastName,
    });

    if (response?.error) {
      throw response.error;
    }

    const user = response?.data?.user || response?.data;
    return normalizeUser(user);
  },

  /**
   * Loga o usuário via Better Auth.
   * @param {object} input - Usuário a ser autenticado.
   * @param {string} input.email - E-mail do usuário.
   * @param {string} input.password - Senha do usuário.
   * @returns {Promise<object>} Usuário autenticado normalizado.
   */
  signin: async (input) => {
    const response = await authClient.signIn.email({
      email: input.email,
      password: input.password,
    });

    if (response?.error) {
      throw response.error;
    }

    const user = response?.data?.user || response?.data;
    return normalizeUser(user);
  },

  /**
   * Encerra a sessão ativa do usuário.
   * @returns {Promise<void>}
   */
  signout: async () => {
    const response = await authClient.signOut();
    if (response?.error) {
      throw response.error;
    }
    return response?.data;
  },

  /**
   * Retorna o usuário autenticado.
   * @returns {Promise<object>} Usuário autenticado normalizado.
   */
  me: async () => {
    const response = await protectedApi.get('/users/me');
    return normalizeUser(response.data);
  },
};

export default AuthService;
