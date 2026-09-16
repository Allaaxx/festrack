import z from 'zod';

export const createTransactionFormSchema = z.object({
  name: z.string().trim().min(1, {
    error: 'O nome é obrigatório.',
  }),
  amount: z.number({
    error: 'O valor é obrigatório.',
  }),
  date: z.date({
    error: 'A data é obrigatória.',
  }),
  type: z.enum(['EARNING', 'EXPENSE', 'INVESTMENT']),
  eventId: z.uuid().nullable().optional(),
});

export const editTransactionFormSchema = createTransactionFormSchema.extend({
  id: z.uuid(),
});
