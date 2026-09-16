import queryString from 'query-string';

import protectedApi from '@/lib/axios';

export const TransactionService = {
  /**
   * Cria uma transação para o usuário autenticado.
   * @param {object} input - Dados da transação a ser criada.
   * @param {string} input.name - Nome da transação.
   * @param {number} input.amount - Valor da transação.
   * @param {string} input.date - Data da transação (YYYY-MM-DD).
   * @param {string} input.type - Tipo da transação (EARNING/EXPENSE/INVESTMENT).
   * @param {string | null} [input.eventId] - ID do evento associado à transação.
   */
  create: async (input) => {
    const response = await protectedApi.post('/transactions/me', {
      name: input.name,
      amount: input.amount,
      date: input.date,
      type: input.type,
      event_id: input.eventId,
    });
    return response.data;
  },

  /**
   * Retorna as transações do usuário autenticado.
   * @param {object} input
   * @param {string} input.from - Data inicial (YYYY-MM-DD).
   * @param {string} input.to - Data final (YYYY-MM-DD).
   */
  getAll: async (input) => {
    const query = queryString.stringify({ from: input.from, to: input.to });
    const response = await protectedApi.get(`transactions/me?${query}`);
    return response.data;
  },

  /**
   * Atualiza uma transação para o usuário autenticado.
   * @param {object} input - Dados a serem atualizados.
   * @param {string} input.id - ID da transação.
   * @param {string} input.name - Nome da transação.
   * @param {number} input.amount - Valor da transação.
   * @param {string} input.date - Data da transação (YYYY-MM-DD).
   * @param {string} input.type - Tipo da transação (EARNING/EXPENSE/INVESTMENT).
   * @param {string | null} [input.eventId] - ID do evento associado à transação.
   */
  update: async (input) => {
    const response = await protectedApi.patch(`transactions/me/${input.id}`, {
      name: input.name,
      amount: input.amount,
      date: input.date,
      type: input.type,
      event_id: input.eventId,
    });
    return response.data;
  },

  /**
   * Deleta uma transação para o usuário autenticado.
   * @param {{ id: string }} input
   */
  delete: async (input) => {
    const response = await protectedApi.delete(`transactions/me/${input.id}`);
    return response.data;
  },
};

export const BalanceService = {
  /**
   * Retorna o balanço do usuário autenticado.
   * @param {object} input
   * @param {string} input.from - Data inicial (YYYY-MM-DD).
   * @param {string} input.to - Data final (YYYY-MM-DD).
   */
  getBalance: async (input) => {
    const queryParams = new URLSearchParams();
    queryParams.set('from', input.from);
    queryParams.set('to', input.to);
    const response = await protectedApi.get(
      `/users/me/balance?${queryParams.toString()}`
    );
    return response.data;
  },
};

export default TransactionService;
