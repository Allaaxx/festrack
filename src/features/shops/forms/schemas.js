import z from 'zod';

export const createShopFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'O nome da loja é obrigatório.' })
    .max(100, { error: 'O nome deve ter no máximo 100 caracteres.' }),
  description: z
    .string()
    .trim()
    .max(500, { error: 'A descrição deve ter no máximo 500 caracteres.' })
    .optional()
    .nullable(),
});
