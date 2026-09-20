import z from 'zod';

const eventBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'O nome é obrigatório.' })
    .max(50, { error: 'O nome deve ter no máximo 50 caracteres.' }),
  description: z
    .string()
    .trim()
    .max(200, { error: 'A descrição deve ter no máximo 200 caracteres.' })
    .optional()
    .nullable(),
  startDate: z.date({ error: 'A data inicial é obrigatória.' }),
  endDate: z.date({ error: 'A data final é obrigatória.' }),
  allDay: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const createEventFormSchema = eventBaseSchema.refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'A data final não pode ser anterior à data inicial.',
    path: ['endDate'],
  }
);

export const editEventFormSchema = eventBaseSchema
  .extend({
    id: z.uuid(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'A data final não pode ser anterior à data inicial.',
    path: ['endDate'],
  });
