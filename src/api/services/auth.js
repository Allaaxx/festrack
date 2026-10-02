import { normalizeUser } from '@/helpers/user';
import { authClient } from '@/lib/auth-client';
import protectedApi, { publicApi } from '@/lib/axios';

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
   * Loga o usuário.
   * @param {object} input - Usuário a ser autenticado.
   * @param {string} input.email - E-mail do usuário.
   * @param {string} input.password - Senha do usuário.
   * @returns {Object} Usuário autenticado.
   * @returns {string} response.tokens - Tokens de autenticação.
   */
  signin: async (input) => {
    const response = await publicApi.post('/auth/login', {
      email: input.email,
      password: input.password,
    });
    return {
      id: response.data.id,
      email: response.data.email,
      firstName: response.data.first_name,
      lastName: response.data.last_name,
      tokens: response.data.tokens,
    };
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
