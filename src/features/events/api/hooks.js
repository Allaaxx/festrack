import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import EventService from '@/features/events/api/services';

export const getEventsQueryKey = ({ userId }) => ['getEvents', userId];

export const useGetEvents = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getEventsQueryKey({ userId: user?.id }),
    queryFn: () => EventService.getAll(),
    enabled: Boolean(user?.id),
  });
};

export const getEventQueryKey = ({ userId, eventId }) => [
  'getEvent',
  userId,
  eventId,
];

export const useGetEvent = ({ eventId } = {}) => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getEventQueryKey({ userId: user?.id, eventId }),
    queryFn: () => EventService.getById(eventId),
    enabled: Boolean(user?.id) && Boolean(eventId),
    initialData: () => {
      const events = queryClient.getQueryData(
        getEventsQueryKey({ userId: user?.id })
      );
      return events?.find((event) => event.id === eventId);
    },
  });
};

export const createEventMutationKey = ['createEvent'];

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: createEventMutationKey,
    mutationFn: (input) => EventService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ userId: user?.id }),
      });
    },
  });
};

export const editEventMutationKey = ['editEvent'];

export const useEditEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: editEventMutationKey,
    mutationFn: (input) => EventService.update(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ userId: user?.id }),
      });
      queryClient.invalidateQueries({
        queryKey: getEventQueryKey({
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
  const { user } = useAuthContext();
  return useMutation({
    mutationKey: deleteEventMutationKey,
    mutationFn: (input) => EventService.delete(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ userId: user?.id }),
      });
      queryClient.invalidateQueries({
        queryKey: getEventQueryKey({
          userId: user?.id,
          eventId: variables?.id,
        }),
      });
    },
  });
};
