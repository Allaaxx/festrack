import protectedApi from '@/lib/axios';

const resolveShopId = (input) => {
  if (typeof input === 'string') return input;
  return input?.shopId ?? input?.id;
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
};

export default ShopService;
