import { zodResolver } from '@hookform/resolvers/zod';
import { startOfDay } from 'date-fns';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useCreateEvent, useEditEvent } from '@/features/events/api/hooks';
import {
  createEventFormSchema,
  editEventFormSchema,
} from '@/features/events/forms/schemas';
import {
  parseEventDate,
  parseEventTime,
} from '@/features/events/helpers/event';

export const useCreateEventForm = ({ onSuccess, onError }) => {
  const { mutateAsync: createEvent } = useCreateEvent();
  const form = useForm({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: startOfDay(new Date()),
      endDate: startOfDay(new Date()),
      allDay: false,
      startTime: '09:00',
      endTime: '10:00',
    },
  });

  const onSubmit = async (data) => {
    try {
      await createEvent(data);
      onSuccess();
    } catch (error) {
      console.error(error);
      onError();
    }
  };

  return { form, onSubmit };
};

const getEditEventFormDefaultValues = (event) => {
  const isAllDay = event?.allDay ?? false;
  const parsedStart = parseEventDate(event?.startDate);
  const parsedEnd = parseEventDate(event?.endDate);

  return {
    id: event?.id ?? '',
    name: event?.name ?? '',
    description: event?.description ?? '',
    startDate: parsedStart ? startOfDay(parsedStart) : startOfDay(new Date()),
    endDate: parsedEnd ? startOfDay(parsedEnd) : startOfDay(new Date()),
    allDay: isAllDay,
    startTime:
      !isAllDay && event?.startDate ? parseEventTime(event.startDate) : '09:00',
    endTime:
      !isAllDay && event?.endDate ? parseEventTime(event.endDate) : '10:00',
  };
};

export const useEditEventForm = ({ event, onSuccess, onError }) => {
  const { mutateAsync: updateEvent } = useEditEvent();
  const form = useForm({
    resolver: zodResolver(editEventFormSchema),
    defaultValues: getEditEventFormDefaultValues(event),
  });

  useEffect(() => {
    if (!event) return;
    form.reset(getEditEventFormDefaultValues(event));
  }, [form, event]);

  const onSubmit = async (data) => {
    try {
      await updateEvent(data);
      onSuccess();
    } catch (error) {
      console.error(error);
      onError();
    }
  };

  return { form, onSubmit };
};
