import { beforeEach, describe, expect, it, vi } from 'vitest';

import EventService from '@/features/events/api/services';
import protectedApi from '@/lib/axios';

vi.mock('@/lib/axios', () => {
  const mockProtectedApi = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockProtectedApi,
    protectedApi: mockProtectedApi,
  };
});

describe('EventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches shop-scoped events and maps shopId, createdByUserId, google_event_id, and googleEventId', async () => {
      const mockRawEvents = [
        {
          id: 'ev-1',
          shop_id: 'shop-10',
          created_by_user_id: 'user-99',
          name: 'Viagem',
          description: 'Férias',
          start_date: '2026-11-01T00:00:00.000Z',
          end_date: '2026-11-05T23:59:00.000Z',
          all_day: true,
          google_event_id: 'g-event-123',
        },
      ];

      protectedApi.get.mockResolvedValue({ data: mockRawEvents });

      const result = await EventService.getAll({ shopId: 'shop-10' });

      expect(protectedApi.get).toHaveBeenCalledWith('/shops/shop-10/events');
      expect(result).toEqual([
        {
          id: 'ev-1',
          shopId: 'shop-10',
          createdByUserId: 'user-99',
          name: 'Viagem',
          description: 'Férias',
          startDate: '2026-11-01T00:00:00.000Z',
          endDate: '2026-11-05T23:59:00.000Z',
          allDay: true,
          tag: null,
          google_event_id: 'g-event-123',
          googleEventId: 'g-event-123',
          syncError: false,
        },
      ]);
    });

    it('trusts explicit all_day from API instead of inferring from 00:00-23:59', async () => {
      protectedApi.get.mockResolvedValue({
        data: [
          {
            id: 'ev-timed-24h',
            shop_id: 'shop-10',
            name: 'Plantão 24h',
            start_date: '2026-11-01T00:00:00.000Z',
            end_date: '2026-11-01T23:59:00.000Z',
            all_day: false,
          },
          {
            id: 'ev-all-day-explicit',
            shop_id: 'shop-10',
            name: 'Feriado',
            start_date: '2026-11-02T03:00:00.000Z',
            end_date: '2026-11-03T02:59:00.000Z',
            all_day: true,
          },
        ],
      });

      const result = await EventService.getAll({ shopId: 'shop-10' });

      expect(result[0].allDay).toBe(false);
      expect(result[1].allDay).toBe(true);
    });
  });

  describe('create', () => {
    it('creates an event under /shops/:shopId/events and maps google_event_id returned from backend', async () => {
      const mockRawCreated = {
        id: 'ev-2',
        shop_id: 'shop-10',
        created_by_user_id: 'user-99',
        name: 'Casamento',
        description: null,
        start_date: '2026-12-10T14:00:00.000Z',
        end_date: '2026-12-10T18:00:00.000Z',
        google_event_id: 'g-event-999',
      };

      protectedApi.post.mockResolvedValue({ data: mockRawCreated });

      const result = await EventService.create({
        shopId: 'shop-10',
        name: 'Casamento',
        startDate: '2026-12-10',
        endDate: '2026-12-10',
        allDay: false,
        startTime: '14:00',
        endTime: '18:00',
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-10/events',
        expect.objectContaining({
          name: 'Casamento',
        })
      );
      expect(result.shopId).toBe('shop-10');
      expect(result.createdByUserId).toBe('user-99');
      expect(result.google_event_id).toBe('g-event-999');
      expect(result.googleEventId).toBe('g-event-999');
      expect(result.syncError).toBe(false);
    });

    it('maps syncError when backend reports a Google Calendar sync failure without blocking', async () => {
      const mockRawCreatedWithSyncFailure = {
        id: 'ev-3',
        shop_id: 'shop-10',
        created_by_user_id: 'user-99',
        name: 'Aniversário',
        description: null,
        start_date: '2026-12-15T19:00:00.000Z',
        end_date: '2026-12-15T22:00:00.000Z',
        google_event_id: null,
        sync_error: true,
      };

      protectedApi.post.mockResolvedValue({
        data: mockRawCreatedWithSyncFailure,
      });

      const result = await EventService.create({
        shopId: 'shop-10',
        name: 'Aniversário',
        startDate: '2026-12-15',
        endDate: '2026-12-15',
        allDay: false,
        startTime: '19:00',
        endTime: '22:00',
      });

      expect(result.id).toBe('ev-3');
      expect(result.shopId).toBe('shop-10');
      expect(result.googleEventId).toBeNull();
      expect(result.syncError).toBe(true);
    });

    it('forwards tag: null in payload when event is created without a tag', async () => {
      protectedApi.post.mockResolvedValue({
        data: {
          id: 'ev-no-tag',
          shop_id: 'shop-10',
          name: 'Evento Sem Tag',
          tag: null,
          start_date: '2026-12-10T14:00:00.000Z',
          end_date: '2026-12-10T18:00:00.000Z',
        },
      });

      await EventService.create({
        shopId: 'shop-10',
        name: 'Evento Sem Tag',
        tag: null,
        startDate: '2026-12-10',
        endDate: '2026-12-10',
        allDay: true,
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-10/events',
        expect.objectContaining({
          tag: null,
        })
      );
    });

    it('forwards tag slug in payload when event is created with a tag', async () => {
      protectedApi.post.mockResolvedValue({
        data: {
          id: 'ev-with-tag',
          shop_id: 'shop-10',
          name: 'Evento Com Tag',
          tag: 'trabalho',
          start_date: '2026-12-10T14:00:00.000Z',
          end_date: '2026-12-10T18:00:00.000Z',
        },
      });

      await EventService.create({
        shopId: 'shop-10',
        name: 'Evento Com Tag',
        tag: 'trabalho',
        startDate: '2026-12-10',
        endDate: '2026-12-10',
        allDay: true,
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-10/events',
        expect.objectContaining({
          tag: 'trabalho',
        })
      );
    });

    it('sends all_day: true with UTC civil boundaries when creating an All-Day Event', async () => {
      protectedApi.post.mockResolvedValue({
        data: {
          id: 'ev-all-day-1',
          shop_id: 'shop-10',
          name: 'Feriado',
          start_date: '2026-11-18T00:00:00.000Z',
          end_date: '2026-11-19T23:59:59.000Z',
          all_day: true,
        },
      });

      const result = await EventService.create({
        shopId: 'shop-10',
        name: 'Feriado',
        startDate: new Date(2026, 10, 18),
        endDate: new Date(2026, 10, 19),
        allDay: true,
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-10/events',
        expect.objectContaining({
          name: 'Feriado',
          all_day: true,
          start_date: '2026-11-18T00:00:00.000Z',
          end_date: '2026-11-19T23:59:59.000Z',
        })
      );
      expect(result.allDay).toBe(true);
    });

    it('sends all_day: false when creating a Timed Event', async () => {
      protectedApi.post.mockResolvedValue({
        data: {
          id: 'ev-timed-1',
          shop_id: 'shop-10',
          name: 'Reunião',
          start_date: '2026-11-18T09:00:00.000Z',
          end_date: '2026-11-18T10:00:00.000Z',
          all_day: false,
        },
      });

      await EventService.create({
        shopId: 'shop-10',
        name: 'Reunião',
        startDate: '2026-11-18',
        endDate: '2026-11-18',
        allDay: false,
        startTime: '09:00',
        endTime: '10:00',
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-10/events',
        expect.objectContaining({
          all_day: false,
        })
      );
    });
  });

  describe('update', () => {
    it('updates an event under /shops/:shopId/events/:id and maps google_event_id', async () => {
      const mockRawUpdated = {
        id: 'ev-2',
        shop_id: 'shop-10',
        created_by_user_id: 'user-99',
        name: 'Casamento - Nova Data',
        description: null,
        start_date: '2026-12-11T14:00:00.000Z',
        end_date: '2026-12-11T18:00:00.000Z',
        all_day: false,
        google_event_id: 'g-event-999',
      };

      protectedApi.patch.mockResolvedValue({ data: mockRawUpdated });

      const result = await EventService.update({
        shopId: 'shop-10',
        id: 'ev-2',
        name: 'Casamento - Nova Data',
        startDate: '2026-12-11',
        endDate: '2026-12-11',
        allDay: false,
        startTime: '14:00',
        endTime: '18:00',
      });

      expect(protectedApi.patch).toHaveBeenCalledWith(
        '/shops/shop-10/events/ev-2',
        expect.objectContaining({
          all_day: false,
        })
      );
      expect(result.shopId).toBe('shop-10');
      expect(result.googleEventId).toBe('g-event-999');
    });

    it('sends all_day: true with UTC civil boundaries when updating an All-Day Event', async () => {
      protectedApi.patch.mockResolvedValue({
        data: {
          id: 'ev-2',
          shop_id: 'shop-10',
          name: 'Feriado Atualizado',
          start_date: '2026-12-11T00:00:00.000Z',
          end_date: '2026-12-12T23:59:59.000Z',
          all_day: true,
        },
      });

      const result = await EventService.update({
        shopId: 'shop-10',
        id: 'ev-2',
        name: 'Feriado Atualizado',
        startDate: new Date(2026, 11, 11),
        endDate: new Date(2026, 11, 12),
        allDay: true,
      });

      expect(protectedApi.patch).toHaveBeenCalledWith(
        '/shops/shop-10/events/ev-2',
        expect.objectContaining({
          all_day: true,
          start_date: '2026-12-11T00:00:00.000Z',
          end_date: '2026-12-12T23:59:59.000Z',
        })
      );
      expect(result.allDay).toBe(true);
    });
  });

  describe('getById', () => {
    it('fetches a single event by positional (shopId, id) arguments and maps attributes consistently', async () => {
      const mockRawEvent = {
        id: 'ev-10',
        shop_id: 'shop-10',
        created_by_user_id: 'user-99',
        name: 'Conferência Tech',
        description: 'Keynote e workshops',
        start_date: '2026-11-20T09:00:00.000Z',
        end_date: '2026-11-20T18:00:00.000Z',
        google_event_id: 'g-event-conf',
      };

      protectedApi.get.mockResolvedValue({ data: mockRawEvent });

      const result = await EventService.getById('shop-10', 'ev-10');

      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/shop-10/events/ev-10'
      );
      expect(result).toEqual({
        id: 'ev-10',
        shopId: 'shop-10',
        createdByUserId: 'user-99',
        name: 'Conferência Tech',
        description: 'Keynote e workshops',
        startDate: '2026-11-20T09:00:00.000Z',
        endDate: '2026-11-20T18:00:00.000Z',
        allDay: false,
        tag: null,
        google_event_id: 'g-event-conf',
        googleEventId: 'g-event-conf',
        syncError: false,
      });
    });

    it('fetches a single event by object { shopId, id } and maps attributes consistently', async () => {
      const mockRawEvent = {
        id: 'ev-20',
        shop_id: 'shop-20',
        created_by_user_id: 'user-42',
        name: 'Festa de Fim de Ano',
        description: null,
        start_date: '2026-12-31T00:00:00.000Z',
        end_date: '2026-12-31T23:59:00.000Z',
        all_day: true,
        google_event_id: null,
        sync_error: true,
      };

      protectedApi.get.mockResolvedValue({ data: mockRawEvent });

      const result = await EventService.getById({
        shopId: 'shop-20',
        id: 'ev-20',
      });

      expect(protectedApi.get).toHaveBeenCalledWith(
        '/shops/shop-20/events/ev-20'
      );
      expect(result).toEqual({
        id: 'ev-20',
        shopId: 'shop-20',
        createdByUserId: 'user-42',
        name: 'Festa de Fim de Ano',
        description: null,
        startDate: '2026-12-31T00:00:00.000Z',
        endDate: '2026-12-31T23:59:00.000Z',
        allDay: true,
        tag: null,
        google_event_id: null,
        googleEventId: null,
        syncError: true,
      });
    });
  });

  describe('delete', () => {
    it('deletes an event under /shops/:shopId/events/:id and maps returned event', async () => {
      const mockRawDeleted = {
        id: 'ev-20',
        shop_id: 'shop-20',
        created_by_user_id: 'user-42',
        name: 'Festa de Fim de Ano',
        description: null,
        start_date: '2026-12-31T00:00:00.000Z',
        end_date: '2026-12-31T23:59:00.000Z',
        google_event_id: null,
        sync_error: false,
      };

      protectedApi.delete.mockResolvedValue({ data: mockRawDeleted });

      const result = await EventService.delete({
        shopId: 'shop-20',
        id: 'ev-20',
      });

      expect(protectedApi.delete).toHaveBeenCalledWith(
        '/shops/shop-20/events/ev-20'
      );
      expect(result.id).toBe('ev-20');
      expect(result.shopId).toBe('shop-20');
    });
  });

  describe('Event Tags API integration (festrack-api #122)', () => {
    it('fetches shop-scoped event tags', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          shop_id: 'shop-1',
          name: 'Viagens',
          slug: 'viagens',
          color: 'bg-indigo-400',
          is_system: false,
        },
      ];
      protectedApi.get.mockResolvedValue({ data: mockTags });

      const result = await EventService.getTags({ shopId: 'shop-1' });

      expect(protectedApi.get).toHaveBeenCalledWith('/shops/shop-1/event-tags');
      expect(result).toEqual(mockTags);
    });

    it('creates a custom event tag', async () => {
      const createdTag = {
        id: 'tag-2',
        shop_id: 'shop-1',
        name: 'Workshops',
        slug: 'workshops',
        color: 'bg-teal-400',
        is_system: false,
      };
      protectedApi.post.mockResolvedValue({ data: createdTag });

      const result = await EventService.createTag({
        shopId: 'shop-1',
        name: 'Workshops',
        color: 'bg-teal-400',
        slug: 'workshops',
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/shops/shop-1/event-tags',
        {
          name: 'Workshops',
          color: 'bg-teal-400',
          slug: 'workshops',
        }
      );
      expect(result).toEqual(createdTag);
    });

    it('deletes a custom event tag', async () => {
      const deletedTag = { id: 'tag-2', name: 'Workshops' };
      protectedApi.delete.mockResolvedValue({ data: deletedTag });

      const result = await EventService.deleteTag({
        shopId: 'shop-1',
        tagId: 'tag-2',
      });

      expect(protectedApi.delete).toHaveBeenCalledWith(
        '/shops/shop-1/event-tags/tag-2'
      );
      expect(result).toEqual(deletedTag);
    });
  });

  describe('author preservation', () => {
    it('preserves author object from API on getAll and getById', async () => {
      const apiAuthor = {
        id: 'user-owner',
        name: 'Maria Silva',
        first_name: 'Maria',
        last_name: 'Silva',
        email: 'maria@example.com',
        image: 'https://example.com/maria.png',
      };

      const rawEvent = {
        id: 'ev-auth-1',
        shop_id: 'shop-10',
        created_by_user_id: 'user-owner',
        name: 'Workshop',
        description: null,
        start_date: '2026-11-01T10:00:00.000Z',
        end_date: '2026-11-01T12:00:00.000Z',
        author: apiAuthor,
      };

      protectedApi.get.mockResolvedValueOnce({ data: [rawEvent] });
      const list = await EventService.getAll({ shopId: 'shop-10' });
      expect(list[0].author).toEqual(apiAuthor);

      protectedApi.get.mockResolvedValueOnce({ data: rawEvent });
      const single = await EventService.getById({
        shopId: 'shop-10',
        id: 'ev-auth-1',
      });
      expect(single.author).toEqual(apiAuthor);
    });
  });
});
