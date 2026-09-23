import { startOfDay } from 'date-fns';
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

const validateEventDates = (data, ctx) => {
  if (!data.startDate || !data.endDate) return;

  const startDay = startOfDay(data.startDate);
  const endDay = startOfDay(data.endDate);

  if (endDay < startDay) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A data final não pode ser anterior à data inicial.',
      path: ['endDate'],
    });
    return;
  }

  // Se não for dia inteiro e for o mesmo dia, valida se o horário final é anterior ao inicial
  if (!data.allDay && endDay.getTime() === startDay.getTime()) {
    const start = data.startTime || '00:00';
    const end = data.endTime || '00:00';
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A hora final não pode ser anterior à hora inicial.',
        path: ['endTime'],
      });
    }
  }
};

export const createEventFormSchema =
  eventBaseSchema.superRefine(validateEventDates);

export const editEventFormSchema = eventBaseSchema
  .extend({
    id: z.uuid(),
  })
  .superRefine(validateEventDates);
