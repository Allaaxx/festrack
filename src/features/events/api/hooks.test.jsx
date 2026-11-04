import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import {
  getEventQueryKey,
  getEventsQueryKey,
  useCreateEvent,
  useDeleteEvent,
  useEditEvent,
  useGetEvent,
  useGetEvents,
} from '@/features/events/api/hooks';
import EventService from '@/features/events/api/services';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/contexts/shop', () => ({
  useShopContext: vi.fn(),
}));

vi.mock('@/features/events/api/services', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Events API Hooks - Shop-Scoped Queries, Mutations & Null Safety', () => {
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
    useShopContext.mockReturnValue({
      activeShop: { id: 'shop-1', name: 'Atelier Central', role: 'OWNER' },
      shops: [{ id: 'shop-1', name: 'Atelier Central', role: 'OWNER' }],
      isLoading: false,
    });
  });

  describe('getEventsQueryKey & getEventQueryKey', () => {
    it('partitions query keys by shopId and falls back to userId when shopId is omitted', () => {
      expect(getEventsQueryKey({ shopId: 'shop-1' })).toEqual([
        'getEvents',
        'shop-1',
      ]);
      expect(getEventsQueryKey({ shopId: 'shop-1', userId: 'u1' })).toEqual([
        'getEvents',
        'shop-1',
      ]);
      expect(getEventsQueryKey({ userId: 'u1' })).toEqual(['getEvents', 'u1']);

      expect(getEventQueryKey({ shopId: 'shop-1', eventId: 'ev-1' })).toEqual([
        'getEvent',
        'shop-1',
        'ev-1',
      ]);
      expect(
        getEventQueryKey({ shopId: 'shop-1', userId: 'u1', eventId: 'ev-1' })
      ).toEqual(['getEvent', 'shop-1', 'ev-1']);
      expect(getEventQueryKey({ userId: 'u1', eventId: 'ev-1' })).toEqual([
        'getEvent',
        'u1',
        'ev-1',
      ]);
    });
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

    it('remains disabled when activeShop is null even if user is authenticated', () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      useShopContext.mockReturnValue({ activeShop: null, shops: [] });

      const { result } = renderHook(() => useGetEvents(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(EventService.getAll).not.toHaveBeenCalled();
    });

    it('fetches events for the active shop when user and activeShop are present', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const mockEvents = [{ id: 'ev-1', shopId: 'shop-1', name: 'Party' }];
      EventService.getAll.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useGetEvents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(EventService.getAll).toHaveBeenCalledWith({ shopId: 'shop-1' });
      expect(result.current.data).toEqual(mockEvents);
    });

    it('refetches events for the new shop without cross-shop cache leaks when activeShop changes', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const shop1Events = [
        { id: 'ev-shop-1', shopId: 'shop-1', name: 'Evento Loja 1' },
      ];
      const shop2Events = [
        { id: 'ev-shop-2', shopId: 'shop-2', name: 'Evento Loja 2' },
      ];

      EventService.getAll.mockImplementation(({ shopId }) =>
        Promise.resolve(shopId === 'shop-1' ? shop1Events : shop2Events)
      );

      let currentShop = { id: 'shop-1', name: 'Loja 1' };
      useShopContext.mockImplementation(() => ({
        activeShop: currentShop,
        shops: [currentShop],
      }));

      const wrapper = createWrapper();
      const { result, rerender } = renderHook(() => useGetEvents(), {
        wrapper,
      });

      await waitFor(() => expect(result.current.data).toEqual(shop1Events));
      expect(EventService.getAll).toHaveBeenCalledWith({ shopId: 'shop-1' });

      currentShop = { id: 'shop-2', name: 'Loja 2' };
      rerender();

      await waitFor(() => expect(result.current.data).toEqual(shop2Events));
      expect(EventService.getAll).toHaveBeenCalledWith({ shopId: 'shop-2' });
    });
  });

  describe('useGetEvent', () => {
    it('does not throw when user is null and query remains disabled', () => {
      useAuthContext.mockReturnValue({ user: null });

      const { result } = renderHook(() => useGetEvent({ eventId: 'ev-1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(EventService.getById).not.toHaveBeenCalled();
    });

    it('remains disabled when activeShop is null', () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      useShopContext.mockReturnValue({ activeShop: null });

      const { result } = renderHook(() => useGetEvent({ eventId: 'ev-1' }), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(EventService.getById).not.toHaveBeenCalled();
    });

    it('does not throw when eventId is null/undefined and query remains disabled', () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });

      const { result } = renderHook(() => useGetEvent(), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.status).toBe('pending');
      expect(EventService.getById).not.toHaveBeenCalled();
    });

    it('fetches single event scoped to activeShop when user, activeShop, and eventId are provided', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const mockEvent = { id: 'ev-1', shopId: 'shop-1', name: 'Aniversário' };
      EventService.getById.mockResolvedValue(mockEvent);

      const { result } = renderHook(() => useGetEvent({ eventId: 'ev-1' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(EventService.getById).toHaveBeenCalledWith({
        shopId: 'shop-1',
        id: 'ev-1',
      });
      expect(result.current.data).toEqual(mockEvent);
    });

    it('uses initialData from active shop getEvents query cache and ignores other shops', () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      const shop1Event = {
        id: 'ev-1',
        shopId: 'shop-1',
        name: 'Aniversário Loja 1',
      };
      const shop2Event = {
        id: 'ev-2',
        shopId: 'shop-2',
        name: 'Aniversário Loja 2',
      };
      const wrapper = createWrapper();
      queryClient.setQueryData(getEventsQueryKey({ shopId: 'shop-1' }), [
        shop1Event,
      ]);
      queryClient.setQueryData(getEventsQueryKey({ shopId: 'shop-2' }), [
        shop2Event,
      ]);

      const { result } = renderHook(() => useGetEvent({ eventId: 'ev-1' }), {
        wrapper,
      });

      expect(result.current.data).toEqual(shop1Event);

      const { result: crossShopResult } = renderHook(
        () => useGetEvent({ eventId: 'ev-2' }),
        { wrapper }
      );
      expect(crossShopResult.current.data).toBeUndefined();
    });
  });

  describe('Events mutations with shop scoping, null safety, and cache invalidation', () => {
    it('useCreateEvent injects activeShop.id and invalidates shop events query', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      EventService.create.mockResolvedValue({ id: 'ev-1', shopId: 'shop-1' });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper,
      });

      result.current.mutate({ name: 'New Event' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(EventService.create).toHaveBeenCalledWith({
        name: 'New Event',
        shopId: 'shop-1',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ shopId: 'shop-1' }),
      });
    });

    it('useCreateEvent safely invalidates query when user and activeShop are null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      useShopContext.mockReturnValue({ activeShop: null });
      EventService.create.mockResolvedValue({ id: 'ev-1' });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper,
      });

      result.current.mutate({ title: 'New Event' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ shopId: undefined, userId: undefined }),
      });
    });

    it('useEditEvent safely invalidates query when user and activeShop are null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      useShopContext.mockReturnValue({ activeShop: null });
      EventService.update.mockResolvedValue({ id: 'ev-1' });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useEditEvent(), {
        wrapper,
      });

      result.current.mutate({ id: 'ev-1', title: 'Updated' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ shopId: undefined, userId: undefined }),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventQueryKey({
          shopId: undefined,
          userId: undefined,
          eventId: 'ev-1',
        }),
      });
    });

    it('useEditEvent injects activeShop.id and invalidates both shop events list and single event', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      EventService.update.mockResolvedValue({
        id: 'ev-1',
        shopId: 'shop-1',
        title: 'Updated',
      });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useEditEvent(), {
        wrapper,
      });

      result.current.mutate({ id: 'ev-1', title: 'Updated' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(EventService.update).toHaveBeenCalledWith({
        id: 'ev-1',
        title: 'Updated',
        shopId: 'shop-1',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ shopId: 'shop-1' }),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventQueryKey({ shopId: 'shop-1', eventId: 'ev-1' }),
      });
    });

    it('useDeleteEvent safely invalidates query when user and activeShop are null', async () => {
      useAuthContext.mockReturnValue({ user: null });
      useShopContext.mockReturnValue({ activeShop: null });
      EventService.delete.mockResolvedValue({ success: true });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteEvent(), {
        wrapper,
      });

      result.current.mutate({ id: 'ev-1' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ shopId: undefined, userId: undefined }),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventQueryKey({
          shopId: undefined,
          userId: undefined,
          eventId: 'ev-1',
        }),
      });
    });

    it('useDeleteEvent injects activeShop.id and invalidates both shop events list and single event', async () => {
      useAuthContext.mockReturnValue({ user: { id: 'u1' } });
      EventService.delete.mockResolvedValue({ success: true });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteEvent(), {
        wrapper,
      });

      result.current.mutate({ id: 'ev-1' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(EventService.delete).toHaveBeenCalledWith({
        id: 'ev-1',
        shopId: 'shop-1',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventsQueryKey({ shopId: 'shop-1' }),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getEventQueryKey({ shopId: 'shop-1', eventId: 'ev-1' }),
      });
    });
  });
});
