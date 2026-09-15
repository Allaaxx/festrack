import protectedApi from '@/lib/axios';

const EventService = {
  /**
   * Retorna os eventos do usuário autenticado.
   * @returns {Promise<Array<{ id: string, name: string }>>}
   */
  getAll: async () => {
    const response = await protectedApi.get('/events/me');
    return response.data;
  },
};

export default EventService;
