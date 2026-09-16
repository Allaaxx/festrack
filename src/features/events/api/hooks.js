import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthContext } from '@/contexts/auth';
import EventService from '@/features/events/api/services';

export const getEventsQueryKey = ({ userId }) => ['getEvents', userId];

export const useGetEvents = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getEventsQueryKey({ userId: user.id }),
    queryFn: () => EventService.getAll(),
    enabled: Boolean(user.id),
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
        queryKey: getEventsQueryKey({ userId: user.id }),
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ userId: user.id }),
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ userId: user.id }),
      });
    },
  });
};
