import queryString from 'query-string';

import protectedApi from '@/lib/axios';

export const TransactionService = {
  /**
   * Cria uma transação para a loja ativa.
   * @param {object} input - Dados da transação a ser criada.
   * @param {string} input.shopId - ID da loja.
   * @param {string} input.name - Nome da transação.
   * @param {number} input.amount - Valor da transação.
   * @param {string} input.date - Data da transação (YYYY-MM-DD).
   * @param {string} input.type - Tipo da transação (EARNING/EXPENSE/INVESTMENT).
   * @param {string | null} [input.eventId] - ID do evento associado à transação.
   */
  create: async (input) => {
    const response = await protectedApi.post(
      `/shops/${input.shopId}/transactions`,
      {
        name: input.name,
        amount: input.amount,
        date: input.date,
        type: input.type,
        event_id: input.eventId,
      }
    );
    return response.data;
  },

  /**
   * Retorna as transações da loja ativa.
   * @param {object} [input]
   * @param {string} [input.shopId] - ID da loja.
   * @param {string} [input.from] - Data inicial (YYYY-MM-DD).
   * @param {string} [input.to] - Data final (YYYY-MM-DD).
   * @param {string} [input.eventId] - ID do evento associado.
   */
  getAll: async (input = {}) => {
    const params = {};
    if (input?.from) params.from = input.from;
    if (input?.to) params.to = input.to;
    if (input?.eventId) params.event_id = input.eventId;

    const query = queryString.stringify(params);
    const basePath = `/shops/${input?.shopId}/transactions`;
    const endpoint = query ? `${basePath}?${query}` : basePath;
    const response = await protectedApi.get(endpoint);
    return response.data;
  },

  /**
   * Atualiza uma transação da loja ativa.
   * @param {object} input - Dados a serem atualizados.
   * @param {string} input.shopId - ID da loja.
   * @param {string} input.id - ID da transação.
   * @param {string} input.name - Nome da transação.
   * @param {number} input.amount - Valor da transação.
   * @param {string} input.date - Data da transação (YYYY-MM-DD).
   * @param {string} input.type - Tipo da transação (EARNING/EXPENSE/INVESTMENT).
   * @param {string | null} [input.eventId] - ID do evento associado à transação.
   */
  update: async (input) => {
    const response = await protectedApi.patch(
      `/shops/${input.shopId}/transactions/${input.id}`,
      {
        name: input.name,
        amount: input.amount,
        date: input.date,
        type: input.type,
        event_id: input.eventId,
      }
    );
    return response.data;
  },

  /**
   * Deleta uma transação da loja ativa.
   * @param {{ shopId?: string, id: string } | string} input
   */
  delete: async (input) => {
    const id = typeof input === 'string' ? input : input?.id;
    const shopId = typeof input === 'object' ? input?.shopId : undefined;
    const response = await protectedApi.delete(
      `/shops/${shopId}/transactions/${id}`
    );
    return response.data;
  },
};

export const BalanceService = {
  /**
   * Retorna o balanço consolidado da loja ativa.
   * @param {object} [input]
   * @param {string} [input.shopId] - ID da loja.
   * @param {string} [input.from] - Data inicial (YYYY-MM-DD).
   * @param {string} [input.to] - Data final (YYYY-MM-DD).
   * @param {string} [input.eventId] - ID do evento associado.
   */
  getBalance: async (input = {}) => {
    const queryParams = new URLSearchParams();
    if (input?.from) queryParams.set('from', input.from);
    if (input?.to) queryParams.set('to', input.to);
    if (input?.eventId) queryParams.set('event_id', input.eventId);

    const query = queryParams.toString();
    const basePath = `/shops/${input?.shopId}/balance`;
    const endpoint = query ? `${basePath}?${query}` : basePath;
    const response = await protectedApi.get(endpoint);
    return response.data;
  },
};

export default TransactionService;
