import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import { useShopContext } from '@/contexts/shop';
import EventService from '@/features/events/api/services';

export const getEventsQueryKey = ({ shopId, userId } = {}) => [
  'getEvents',
  shopId ?? userId,
];

export const useGetEvents = () => {
  const { user } = useAuthContext() || {};
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: getEventsQueryKey({ shopId, userId: user?.id }),
    queryFn: () => EventService.getAll({ shopId }),
    enabled: Boolean(user?.id) && Boolean(shopId),
  });
};

export const getEventQueryKey = ({ shopId, userId, eventId } = {}) => [
  'getEvent',
  shopId ?? userId,
  eventId,
];

export const useGetEvent = ({ eventId } = {}) => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext() || {};
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;

  return useQuery({
    queryKey: getEventQueryKey({ shopId, userId: user?.id, eventId }),
    queryFn: () => EventService.getById({ shopId, id: eventId }),
    enabled: Boolean(user?.id) && Boolean(shopId) && Boolean(eventId),
    initialData: () => {
      if (!shopId) return undefined;
      const events = queryClient.getQueryData(
        getEventsQueryKey({ shopId, userId: user?.id })
      );
      return events?.find((event) => event.id === eventId);
    },
  });
};

export const createEventMutationKey = ['createEvent'];

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext() || {};
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;

  return useMutation({
    mutationKey: createEventMutationKey,
    mutationFn: (input) =>
      EventService.create({
        ...input,
        shopId: input?.shopId ?? shopId,
      }),
    onSuccess: (_data, variables) => {
      const targetShopId = variables?.shopId ?? shopId;
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ shopId: targetShopId, userId: user?.id }),
      });
    },
  });
};

export const editEventMutationKey = ['editEvent'];

export const useEditEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext() || {};
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;

  return useMutation({
    mutationKey: editEventMutationKey,
    mutationFn: (input) =>
      EventService.update({
        ...input,
        shopId: input?.shopId ?? shopId,
      }),
    onSuccess: (_data, variables) => {
      const targetShopId = variables?.shopId ?? shopId;
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ shopId: targetShopId, userId: user?.id }),
      });
      queryClient.invalidateQueries({
        queryKey: getEventQueryKey({
          shopId: targetShopId,
          userId: user?.id,
          eventId: variables?.id,
        }),
      });
    },
  });
};

export const deleteEventMutationKey = ['deleteEvent'];

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext() || {};
  const { activeShop } = useShopContext() || {};
  const shopId = activeShop?.id;

  return useMutation({
    mutationKey: deleteEventMutationKey,
    mutationFn: (input) => {
      const normalizedInput =
        typeof input === 'string' ? { id: input } : { ...input };
      return EventService.delete({
        ...normalizedInput,
        shopId: normalizedInput.shopId ?? shopId,
      });
    },
    onSuccess: (_data, variables) => {
      const eventId = typeof variables === 'string' ? variables : variables?.id;
      const targetShopId =
        typeof variables === 'object' && variables !== null
          ? (variables.shopId ?? shopId)
          : shopId;
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ shopId: targetShopId, userId: user?.id }),
      });
      queryClient.invalidateQueries({
        queryKey: getEventQueryKey({
          shopId: targetShopId,
          userId: user?.id,
          eventId,
        }),
      });
    },
  });
};
