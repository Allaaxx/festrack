import z from 'zod';

export const createEventFormSchema = z
  .object({
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
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'A data final não pode ser anterior à data inicial.',
    path: ['endDate'],
  });

export const editEventFormSchema = z
  .object({
    id: z.string(),
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
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'A data final não pode ser anterior à data inicial.',
    path: ['endDate'],
  });
