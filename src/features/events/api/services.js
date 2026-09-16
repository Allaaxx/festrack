import { formatEventDateToApi } from '@/features/events/helpers/event';
import protectedApi from '@/lib/axios';

const mapEventFromApi = (event) => ({
  id: event.id,
  name: event.name,
  description: event.description ?? null,
  startDate: event.start_date,
  endDate: event.end_date,
});

const EventService = {
  /**
   * Busca todos os eventos do usuário autenticado.
   * @returns {Promise<Array<{ id: string, name: string, description: string | null, startDate: string, endDate: string }>>}
   */
  getAll: async () => {
    const response = await protectedApi.get('/events/me');
    return response.data.map(mapEventFromApi);
  },

  /**
   * Cria um evento para o usuário autenticado.
   * @param {{
   *   name: string,
   *   description?: string | null,
   *   startDate: Date | string,
   *   endDate: Date | string,
   * }} input
   */
  create: async (input) => {
    const response = await protectedApi.post('/events/me', {
      name: input.name,
      description: input.description || null,
      start_date: formatEventDateToApi(input.startDate, 'start'),
      end_date: formatEventDateToApi(input.endDate, 'end'),
    });

    return mapEventFromApi(response.data);
  },

  /**
   * Atualiza um evento do usuário autenticado.
   * @param {{
   *   id: string,
   *   name: string,
   *   description?: string | null,
   *   startDate: Date | string,
   *   endDate: Date | string,
   * }} input
   */
  update: async (input) => {
    const response = await protectedApi.patch(`/events/me/${input.id}`, {
      name: input.name,
      description: input.description || null,
      start_date: formatEventDateToApi(input.startDate, 'start'),
      end_date: formatEventDateToApi(input.endDate, 'end'),
    });

    return mapEventFromApi(response.data);
  },

  /**
   * Exclui um evento do usuário autenticado.
   * @param {{ id: string }} input
   */
  delete: async (input) => {
    const response = await protectedApi.delete(`/events/me/${input.id}`);
    return response.data ? mapEventFromApi(response.data) : null;
  },
};

export default EventService;
