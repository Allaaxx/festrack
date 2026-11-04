import protectedApi from '@/lib/axios';

const resolveShopId = (input) => {
  if (typeof input === 'string') return input;
  return input?.shopId ?? input?.id;
};

const resolveInvitationToken = (input) => {
  if (typeof input === 'string') return input;
  return input?.token;
};

const ShopService = {
  /**
   * Busca todas as lojas das quais o usuário autenticado faz parte.
   * @returns {Promise<Array<{ id: string, name: string, description: string | null, role: 'OWNER' | 'MEMBER', created_at?: string, updated_at?: string }>>}
   */
  getAll: async () => {
    const response = await protectedApi.get('/shops');
    return response.data;
  },

  /**
   * Cria uma nova loja tendo o usuário autenticado como proprietário (OWNER).
   * @param {{ name: string, description?: string | null }} input
   * @returns {Promise<{ id: string, name: string, description: string | null, role: 'OWNER', created_at?: string, updated_at?: string }>}
   */
  create: async (input) => {
    const response = await protectedApi.post('/shops', {
      name: input.name,
      description: input.description ? input.description.trim() : null,
    });
    return response.data;
  },

  /**
   * Busca os detalhes de uma loja específica pelo ID.
   * @param {string | { shopId?: string, id?: string }} input
   * @returns {Promise<{ id: string, name: string, description: string | null, created_at?: string, updated_at?: string }>}
   */
  getById: async (input) => {
    const shopId = resolveShopId(input);
    const response = await protectedApi.get(`/shops/${shopId}`);
    return response.data;
  },

  /**
   * Atualiza os dados de uma loja específica (requer papel OWNER).
   * @param {{ shopId?: string, id?: string, name?: string, description?: string | null }} input
   * @returns {Promise<{ id: string, name: string, description: string | null, created_at?: string, updated_at?: string }>}
   */
  update: async (input) => {
    const shopId = resolveShopId(input);
    const payload = {};
    if (input.name !== undefined) {
      payload.name = input.name;
    }
    if (input.description !== undefined) {
      payload.description = input.description ? input.description.trim() : null;
    }
    const response = await protectedApi.patch(`/shops/${shopId}`, payload);
    return response.data;
  },

  /**
   * Exclui permanentemente uma loja específica (requer papel OWNER).
   * @param {string | { shopId?: string, id?: string }} input
   * @returns {Promise<{ id: string, name: string, description: string | null }>}
   */
  delete: async (input) => {
    const shopId = resolveShopId(input);
    const response = await protectedApi.delete(`/shops/${shopId}`);
    return response.data;
  },

  /**
   * Busca os detalhes públicos/prévia de um convite de loja pelo token.
   * @param {string | { token?: string }} input
   * @returns {Promise<{ id: string, shop_id?: string, shop_name?: string, shop?: { id: string, name: string, description?: string | null }, email: string, role: 'OWNER' | 'MEMBER', status?: string, expires_at?: string }>}
   */
  getInvitationByToken: async (input) => {
    const token = resolveInvitationToken(input);
    const response = await protectedApi.get(`/shops/invitations/${token}`);
    return response.data;
  },

  /**
   * Aceita um convite de loja pelo token (requer usuário autenticado com o mesmo e-mail do convite).
   * @param {string | { token?: string }} input
   * @returns {Promise<{ id: string, shop_id: string, user_id: string, role: 'OWNER' | 'MEMBER', created_at?: string, updated_at?: string }>}
   */
  acceptInvitation: async (input) => {
    const token = resolveInvitationToken(input);
    const response = await protectedApi.post(
      `/shops/invitations/${token}/accept`
    );
    return response.data;
  },
};

export default ShopService;
