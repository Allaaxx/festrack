import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import {
  getEventsQueryKey,
  useCreateEvent,
  useDeleteEvent,
  useEditEvent,
  useGetEvents,
} from '@/features/events/api/hooks';
import EventService from '@/features/events/api/services';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/features/events/api/services', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Events API Hooks - Unauthenticated & Null Safety', () => {
  let queryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGetEvents', () => {
    it('does not throw when user is null and query remains disabled', () => {
      useAuthContext.mockReturnValue({ user: null });

      const { result } = renderHook(() => useGetEvents(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(EventService.getAll).not.toHaveBeenCalled();
    });

    it('fetches events when user is authenticated', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const mockEvents = [{ id: 'ev-1', title: 'Party' }];
      EventService.getAll.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useGetEvents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(EventService.getAll).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockEvents);
    });
  });

  describe('Events mutations with null safety', () => {
    it('useCreateEvent safely invalidates query when user is null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      EventService.create.mockResolvedValue({ id: 'ev-1' });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper,
      });

      result.current.mutate({ title: 'New Event' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ userId: undefined }),
      });
    });

    it('useEditEvent safely invalidates query when user is null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      EventService.update.mockResolvedValue({ id: 'ev-1' });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useEditEvent(), {
        wrapper,
      });

      result.current.mutate({ id: 'ev-1', title: 'Updated' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ userId: undefined }),
      });
    });

    it('useDeleteEvent safely invalidates query when user is null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      EventService.delete.mockResolvedValue({ success: true });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteEvent(), {
        wrapper,
      });

      result.current.mutate({ id: 'ev-1' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ userId: undefined }),
      });
    });
  });
});
