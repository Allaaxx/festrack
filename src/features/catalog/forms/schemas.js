import z from 'zod';

export const STOCK_MOVEMENT_TYPES = {
  ADJUSTMENT: 'ADJUSTMENT',
  INBOUND: 'INBOUND',
  LOSS: 'LOSS',
};

export const stockAdjustFormSchema = z.object({
  type: z
    .enum(['ADJUSTMENT', 'INBOUND', 'LOSS'], {
      required_error: 'Selecione o tipo de movimentação.',
    })
    .default('ADJUSTMENT'),
  quantity: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z
      .number({
        required_error: 'A quantidade é obrigatória.',
        invalid_type_error: 'A quantidade deve ser um número válido.',
      })
      .int('A quantidade deve ser um número inteiro.')
      .min(1, 'A quantidade deve ser maior ou igual a 1.')
  ),
  reason: z
    .string({
      required_error: 'O motivo é obrigatório.',
    })
    .trim()
    .min(3, 'O motivo deve ter pelo menos 3 caracteres.')
    .max(500, 'O motivo deve ter no máximo 500 caracteres.'),
});
