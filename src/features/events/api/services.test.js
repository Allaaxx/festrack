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
    it('fetches events and maps google_event_id and googleEventId', async () => {
      const mockRawEvents = [
        {
          id: 'ev-1',
          name: 'Viagem',
          description: 'Férias',
          start_date: '2026-11-01T00:00:00.000Z',
          end_date: '2026-11-05T23:59:00.000Z',
          google_event_id: 'g-event-123',
        },
      ];

      protectedApi.get.mockResolvedValue({ data: mockRawEvents });

      const result = await EventService.getAll();

      expect(protectedApi.get).toHaveBeenCalledWith('/events/me');
      expect(result).toEqual([
        {
          id: 'ev-1',
          name: 'Viagem',
          description: 'Férias',
          startDate: '2026-11-01T00:00:00.000Z',
          endDate: '2026-11-05T23:59:00.000Z',
          allDay: true,
          google_event_id: 'g-event-123',
          googleEventId: 'g-event-123',
          syncError: false,
        },
      ]);
    });
  });

  describe('create', () => {
    it('creates an event and maps google_event_id returned from backend', async () => {
      const mockRawCreated = {
        id: 'ev-2',
        name: 'Casamento',
        description: null,
        start_date: '2026-12-10T14:00:00.000Z',
        end_date: '2026-12-10T18:00:00.000Z',
        google_event_id: 'g-event-999',
      };

      protectedApi.post.mockResolvedValue({ data: mockRawCreated });

      const result = await EventService.create({
        name: 'Casamento',
        startDate: '2026-12-10',
        endDate: '2026-12-10',
        allDay: false,
        startTime: '14:00',
        endTime: '18:00',
      });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/events/me',
        expect.objectContaining({
          name: 'Casamento',
        })
      );
      expect(result.google_event_id).toBe('g-event-999');
      expect(result.googleEventId).toBe('g-event-999');
      expect(result.syncError).toBe(false);
    });

    it('maps syncError when backend reports a Google Calendar sync failure without blocking', async () => {
      const mockRawCreatedWithSyncFailure = {
        id: 'ev-3',
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
        name: 'Aniversário',
        startDate: '2026-12-15',
        endDate: '2026-12-15',
        allDay: false,
        startTime: '19:00',
        endTime: '22:00',
      });

      expect(result.id).toBe('ev-3');
      expect(result.googleEventId).toBeNull();
      expect(result.syncError).toBe(true);
    });
  });

  describe('update', () => {
    it('updates an event and maps google_event_id', async () => {
      const mockRawUpdated = {
        id: 'ev-2',
        name: 'Casamento - Nova Data',
        description: null,
        start_date: '2026-12-11T14:00:00.000Z',
        end_date: '2026-12-11T18:00:00.000Z',
        google_event_id: 'g-event-999',
      };

      protectedApi.patch.mockResolvedValue({ data: mockRawUpdated });

      const result = await EventService.update({
        id: 'ev-2',
        name: 'Casamento - Nova Data',
        startDate: '2026-12-11',
        endDate: '2026-12-11',
        allDay: false,
        startTime: '14:00',
        endTime: '18:00',
      });

      expect(protectedApi.patch).toHaveBeenCalledWith(
        '/events/me/ev-2',
        expect.any(Object)
      );
      expect(result.googleEventId).toBe('g-event-999');
    });
  });
});
