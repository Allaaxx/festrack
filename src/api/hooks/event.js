import { useQuery } from '@tanstack/react-query';

import EventService from '@/api/services/event';
import { useAuthContext } from '@/contexts/auth';

export const getEventsQueryKey = ({ userId }) => ['getEvents', userId];

export const useGetEvents = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getEventsQueryKey({ userId: user.id }),
    queryFn: () => EventService.getAll(),
    enabled: Boolean(user.id),
  });
};
