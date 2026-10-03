import { normalizeUser } from '@/helpers/user';
import protectedApi from '@/lib/axios';

export const UserService = {
  /**
   * Atualiza os dados de perfil do usuário autenticado.
   * @param {object} input - Dados do perfil a atualizar.
   * @param {string} [input.firstName] - Primeiro nome.
   * @param {string} [input.lastName] - Sobrenome.
   * @param {string} [input.first_name] - Primeiro nome (snake_case).
   * @param {string} [input.last_name] - Sobrenome (snake_case).
   * @returns {Promise<object>} Usuário atualizado normalizado.
   */
  updateProfile: async (input) => {
    const firstName = input.firstName ?? input.first_name;
    const lastName = input.lastName ?? input.last_name;

    const payload = {};
    if (firstName !== undefined) payload.first_name = firstName;
    if (lastName !== undefined) payload.last_name = lastName;

    const response = await protectedApi.patch('/users/me', payload);
    return normalizeUser(response.data);
  },

  /**
   * Envia a imagem de avatar do usuário autenticado.
   * @param {File} file - Arquivo de imagem do avatar.
   * @returns {Promise<object>} Usuário atualizado com a nova URL de avatar normalizado.
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await protectedApi.post('/users/me/avatar', formData);
    return normalizeUser(response.data);
  },
};

export default UserService;
