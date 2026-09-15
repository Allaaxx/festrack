import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
  useCreateTransaction,
  useEditTransaction,
} from '@/api/hooks/transaction';
import {
  createTransactionFormSchema,
  editTransactionFormSchema,
} from '@/forms/schemas/transaction';

export const useCreateTransactionForm = ({ onSuccess, onError }) => {
  const { mutateAsync: createTransaction } = useCreateTransaction();
  const form = useForm({
    resolver: zodResolver(createTransactionFormSchema),
    defaultValues: {
      name: '',
      amount: 0,
      date: new Date(),
      type: 'EARNING',
      eventId: null,
    },
    shouldUnregister: true,
  });

  const onSubmit = async (data) => {
    try {
      await createTransaction(data);
      onSuccess();
    } catch (error) {
      console.error(error);
      onError();
    }
  };

  return { form, onSubmit };
};

const getEditTransactionFormDefaultValues = (transaction) => ({
  name: transaction?.name ?? '',
  amount: transaction?.amount ? parseFloat(transaction.amount) : 0,
  date: transaction?.date ? new Date(transaction.date) : new Date(),
  type: transaction?.type ?? 'EARNING',
  eventId: transaction?.event_id ?? transaction?.event?.id ?? null,
});

export const useEditTransactionForm = ({ transaction, onSuccess, onError }) => {
  const { mutateAsync: updateTransaction } = useEditTransaction();
  const form = useForm({
    resolver: zodResolver(editTransactionFormSchema),
    defaultValues: getEditTransactionFormDefaultValues(transaction),
    shouldUnregister: true,
  });

  useEffect(() => {
    form.reset(getEditTransactionFormDefaultValues(transaction));
    form.setValue('id', transaction.id);
  }, [form, transaction]);

  const onSubmit = async (data) => {
    await updateTransaction(data);
    try {
      onSuccess();
    } catch (error) {
      console.error(error);
      onError();
    }
  };

  return { form, onSubmit };
};
