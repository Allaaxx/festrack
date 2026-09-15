import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { useCreateEvent, useEditEvent } from '@/api/hooks/event';
import {
  createEventFormSchema,
  editEventFormSchema,
} from '@/forms/schemas/event';
import { parseEventDate } from '@/helpers/event';

export const useCreateEventForm = ({ onSuccess, onError }) => {
  const { mutateAsync: createEvent } = useCreateEvent();
  const form = useForm({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
    },
    shouldUnregister: true,
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

const getEditEventFormDefaultValues = (event) => ({
  id: event?.id ?? '',
  name: event?.name ?? '',
  description: event?.description ?? '',
  startDate: parseEventDate(event?.startDate) ?? new Date(),
  endDate: parseEventDate(event?.endDate) ?? new Date(),
});

export const useEditEventForm = ({ event, onSuccess, onError }) => {
  const { mutateAsync: updateEvent } = useEditEvent();
  const form = useForm({
    resolver: zodResolver(editEventFormSchema),
    defaultValues: getEditEventFormDefaultValues(event),
    shouldUnregister: true,
  });

  useEffect(() => {
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
