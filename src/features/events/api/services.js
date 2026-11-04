import {
  formatEventDateToApi,
  parseEventTime,
} from '@/features/events/helpers/event';
import protectedApi from '@/lib/axios';

const mapEventFromApi = (event) => {
  const startTime = parseEventTime(event.start_date);
  const endTime = parseEventTime(event.end_date);

  // Se a hora for exata meia-noite e fim do dia (23:59), consideramos o dia todo.
  const allDay = startTime === '00:00' && endTime === '23:59';
  const googleEventId = event.google_event_id ?? event.googleEventId ?? null;
  const syncError = Boolean(event.sync_error ?? event.syncError);
  const shopId = event.shop_id ?? event.shopId ?? null;
  const createdByUserId =
    event.created_by_user_id ?? event.createdByUserId ?? event.user_id ?? null;

  return {
    id: event.id,
    shopId,
    createdByUserId,
    name: event.name,
    description: event.description ?? null,
    startDate: event.start_date,
    endDate: event.end_date,
    allDay,
    google_event_id: googleEventId,
    googleEventId,
    syncError,
  };
};

const resolveShopEventParams = (idOrParams, maybeId) => {
  if (typeof idOrParams === 'object' && idOrParams !== null) {
    return {
      shopId: idOrParams.shopId,
      id: idOrParams.id ?? idOrParams.eventId,
    };
  }
  return {
    shopId: idOrParams,
    id: maybeId,
  };
};

const EventService = {
  /**
   * Busca todos os eventos da loja ativa.
   * @param {{ shopId: string }} [input]
   * @returns {Promise<Array<{ id: string, shopId: string | null, createdByUserId: string | null, name: string, description: string | null, startDate: string, endDate: string, allDay: boolean }>>}
   */
  getAll: async ({ shopId } = {}) => {
    const response = await protectedApi.get(`/shops/${shopId}/events`);
    return response.data.map(mapEventFromApi);
  },

  /**
   * Busca um evento específico pelo ID na loja ativa.
   * @param {string | { shopId: string, id: string }} idOrParams - ID da loja ou objeto contendo shopId e id.
   * @param {string} [maybeId] - ID do evento quando o primeiro parâmetro for shopId.
   * @returns {Promise<{ id: string, shopId: string | null, createdByUserId: string | null, name: string, description: string | null, startDate: string, endDate: string, allDay: boolean, googleEventId: string | null, syncError: boolean }>}
   */
  getById: async (idOrParams, maybeId) => {
    const { shopId, id } = resolveShopEventParams(idOrParams, maybeId);
    const response = await protectedApi.get(`/shops/${shopId}/events/${id}`);
    return mapEventFromApi(response.data);
  },

  /**
   * Cria um evento na loja ativa.
   * @param {{
   *   shopId: string,
   *   name: string,
   *   description?: string | null,
   *   startDate: Date | string,
   *   endDate: Date | string,
   *   allDay: boolean,
   *   startTime?: string,
   *   endTime?: string,
   * }} input
   */
  create: async ({ shopId, ...input }) => {
    const response = await protectedApi.post(`/shops/${shopId}/events`, {
      name: input.name,
      description: input.description || null,
      start_date: formatEventDateToApi(
        input.startDate,
        'start',
        input.allDay,
        input.startTime
      ),
      end_date: formatEventDateToApi(
        input.endDate,
        'end',
        input.allDay,
        input.endTime
      ),
    });

    return mapEventFromApi(response.data);
  },

  /**
   * Atualiza um evento na loja ativa.
   * @param {{
   *   shopId: string,
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
  update: async ({ shopId, id, ...input }) => {
    const response = await protectedApi.patch(`/shops/${shopId}/events/${id}`, {
      name: input.name,
      description: input.description || null,
      start_date: formatEventDateToApi(
        input.startDate,
        'start',
        input.allDay,
        input.startTime
      ),
      end_date: formatEventDateToApi(
        input.endDate,
        'end',
        input.allDay,
        input.endTime
      ),
    });

    return mapEventFromApi(response.data);
  },

  /**
   * Exclui um evento na loja ativa.
   * @param {{ shopId: string, id: string } | string} idOrParams
   * @param {string} [maybeId]
   */
  delete: async (idOrParams, maybeId) => {
    const { shopId, id } = resolveShopEventParams(idOrParams, maybeId);
    const response = await protectedApi.delete(
      `/shops/${shopId}/events/${id}`
    );
    return response.data ? mapEventFromApi(response.data) : null;
  },
};

export default EventService;
