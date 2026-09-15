import queryString from 'query-string';

import protectedApi from '@/lib/axios';

const TransactionService = {
  /**
   * Cria uma transação para o usuário autenticado.
   * @param {object} input - Usuário a ser criado.
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
      eventId: input.eventId,
    });
    return response.data;
  },
  /**
   * Retorna as transações do usuário autenticado.
   * @param {object} input
   * @param {string} input.from - Data inicial (YYYY-MM-DD).
   * @param {number} input.to - Data final (YYYY-MM-DD).
   */
  getAll: async (input) => {
    const query = queryString.stringify({ from: input.from, to: input.to });
    const response = await protectedApi.get(`transactions/me?${query}`);
    return response.data;
  },
  /**
   * Atualiza uma transação para o usuário autenticado.
   * @param {object} input - Dados a ser Atualizado.
   * @param {string} input.id - ID da transção.
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
      eventId: input.eventId,
    });
    return response.data;
  },
  /**
   * Deleta uma transação para o usuário autenticado.
   * @param {string} input.id - ID da transção.
   */
  delete: async (input) => {
    const response = await protectedApi.delete(`transactions/me/${input.id}`);
    return response.data;
  },
};

export default TransactionService;
