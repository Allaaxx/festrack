import { resolveCallbackUrl } from '@/helpers/url';
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

  /**
   * Inicia o fluxo de autenticação social com Google via Better Auth.
   * @param {{ callbackURL?: string, scopes?: string[], [key: string]: any }} [options]
   * @returns {Promise<object>}
   */
  signInWithGoogle: async ({
    callbackURL = '/',
    scopes = ['openid', 'profile', 'email'],
    ...rest
  } = {}) => {
    const payload = {
      provider: 'google',
      callbackURL: resolveCallbackUrl(callbackURL),
      scopes,
      ...rest,
    };

    if (rest.newUserCallbackURL) {
      payload.newUserCallbackURL = resolveCallbackUrl(rest.newUserCallbackURL);
    }

    if (rest.errorCallbackURL) {
      payload.errorCallbackURL = resolveCallbackUrl(rest.errorCallbackURL);
    }

    const response = await authClient.signIn.social(payload);

    if (response?.error) {
      throw response.error;
    }

    return response?.data;
  },

  /**
   * Inicia o vínculo de uma conta social externa via Better Auth.
   * @param {{
   *   provider?: string,
   *   callbackURL?: string,
   *   scopes?: string[],
   *   additionalParams?: Record<string, string>,
   *   [key: string]: any
   * }} [options]
   * @returns {Promise<object>}
   */
  linkSocial: async ({
    provider = 'google',
    callbackURL = '/settings',
    scopes,
    additionalParams,
    ...rest
  } = {}) => {
    const payload = {
      provider,
      callbackURL: resolveCallbackUrl(callbackURL),
      ...rest,
    };

    if (rest.errorCallbackURL) {
      payload.errorCallbackURL = resolveCallbackUrl(rest.errorCallbackURL);
    }

    if (scopes) {
      payload.scopes = scopes;
    }

    if (additionalParams) {
      payload.additionalParams = additionalParams;
    }

    const response = await authClient.linkSocial(payload);

    if (response?.error) {
      throw response.error;
    }

    return response?.data;
  },
};

export default AuthService;
