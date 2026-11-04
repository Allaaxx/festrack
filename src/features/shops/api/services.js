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

  /**
   * Lista os membros ativos de uma loja específica.
   * @param {string | { shopId?: string, id?: string }} input
   * @returns {Promise<Array<{ id: string, shop_id: string, user_id: string, role: 'OWNER' | 'MEMBER', created_at?: string, updated_at?: string, user?: { id: string, name: string, email: string, first_name?: string, last_name?: string, image?: string | null } }>>}
   */
  getMembers: async (input) => {
    const shopId = resolveShopId(input);
    const response = await protectedApi.get(`/shops/${shopId}/members`);
    return response.data;
  },

  /**
   * Remove um membro de uma loja (ou permite que um membro saia da loja).
   * @param {{ shopId?: string, id?: string, userId?: string, memberUserId?: string }} input
   * @returns {Promise<{ id: string, shop_id: string, user_id: string, role: 'OWNER' | 'MEMBER' }>}
   */
  removeMember: async (input) => {
    const shopId = resolveShopId(input);
    const userId = input?.userId ?? input?.memberUserId ?? input?.memberId;
    const response = await protectedApi.delete(
      `/shops/${shopId}/members/${userId}`
    );
    return response.data;
  },

  /**
   * Transfere a propriedade (posse) da loja para outro membro ativo (requer papel OWNER).
   * @param {{ shopId?: string, id?: string, newOwnerUserId?: string, new_owner_user_id?: string, userId?: string }} input
   * @returns {Promise<{ id: string, shop_id: string, user_id: string, role: 'OWNER' }>}
   */
  transferOwnership: async (input) => {
    const shopId = resolveShopId(input);
    const newOwnerUserId =
      input?.newOwnerUserId ?? input?.new_owner_user_id ?? input?.userId;
    const response = await protectedApi.post(
      `/shops/${shopId}/transfer-ownership`,
      {
        new_owner_user_id: newOwnerUserId,
      }
    );
    return response.data;
  },

  /**
   * Lista os convites pendentes de uma loja (requer papel OWNER).
   * @param {string | { shopId?: string, id?: string }} input
   * @returns {Promise<Array<{ id: string, shop_id: string, email: string, role: 'OWNER' | 'MEMBER', token: string, status: 'PENDING', expires_at?: string, created_at?: string }>>}
   */
  getInvitations: async (input) => {
    const shopId = resolveShopId(input);
    const response = await protectedApi.get(`/shops/${shopId}/invitations`);
    return response.data;
  },

  /**
   * Cria um novo convite de membro para uma loja (requer papel OWNER).
   * @param {{ shopId?: string, id?: string, email: string, role?: 'OWNER' | 'MEMBER' }} input
   * @returns {Promise<{ id: string, shop_id: string, email: string, role: 'OWNER' | 'MEMBER', token: string, status: 'PENDING', expires_at?: string }>}
   */
  createInvitation: async (input) => {
    const shopId = resolveShopId(input);
    const response = await protectedApi.post(`/shops/${shopId}/invitations`, {
      email: input.email.trim(),
      role: input.role || 'MEMBER',
    });
    return response.data;
  },

  /**
   * Revoga um convite pendente de uma loja (requer papel OWNER).
   * @param {{ shopId?: string, id?: string, invitationId?: string }} input
   * @returns {Promise<{ id: string, shop_id: string, status: 'REVOKED' }>}
   */
  revokeInvitation: async (input) => {
    const shopId = resolveShopId(input);
    const invitationId =
      input?.invitationId ?? (input?.shopId ? input?.id : undefined);
    const response = await protectedApi.delete(
      `/shops/${shopId}/invitations/${invitationId}`
    );
    return response.data;
  },
};

export default ShopService;
