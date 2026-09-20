import { formatEventDateToApi, parseEventTime } from '@/features/events/helpers/event';
import protectedApi from '@/lib/axios';

const mapEventFromApi = (event) => {
  const startTime = parseEventTime(event.start_date);
  const endTime = parseEventTime(event.end_date);
  
  // Se a hora for exata meia-noite e fim do dia (23:59), consideramos o dia todo.
  const allDay = startTime === '00:00' && endTime === '23:59';
  
  return {
    id: event.id,
    name: event.name,
    description: event.description ?? null,
    startDate: event.start_date,
    endDate: event.end_date,
    allDay,
  };
};

const EventService = {
  /**
   * Busca todos os eventos do usuário autenticado.
   * @returns {Promise<Array<{ id: string, name: string, description: string | null, startDate: string, endDate: string, allDay: boolean }>>}
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
   *   allDay: boolean,
   *   startTime?: string,
   *   endTime?: string,
   * }} input
   */
  create: async (input) => {
    const response = await protectedApi.post('/events/me', {
      name: input.name,
      description: input.description || null,
      start_date: formatEventDateToApi(input.startDate, 'start', input.allDay, input.startTime),
      end_date: formatEventDateToApi(input.endDate, 'end', input.allDay, input.endTime),
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
   *   allDay: boolean,
   *   startTime?: string,
   *   endTime?: string,
   * }} input
   */
  update: async (input) => {
    const response = await protectedApi.patch(`/events/me/${input.id}`, {
      name: input.name,
      description: input.description || null,
      start_date: formatEventDateToApi(input.startDate, 'start', input.allDay, input.startTime),
      end_date: formatEventDateToApi(input.endDate, 'end', input.allDay, input.endTime),
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
