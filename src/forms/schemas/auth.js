import z from 'zod';

export const signInFormSchema = z.object({
  email: z
    .email({
      error: 'O e-mail é inválido.',
    })
    .trim()
    .min(1, {
      error: 'O e-mail é obrigatório.',
    }),
  password: z.string().trim().min(6, {
    error: 'A senha deve ter no mínimo 6 caracteres.',
  }),
});

export const signUpFormSchema = z
  .object({
    firstName: z.string().trim().min(1, {
      error: 'O nome é obrigatório.',
    }),
    lastName: z.string().trim().min(1, {
      error: 'O sobrenome é obrigatório.',
    }),
    email: z
      .email({
        error: 'O e-mail é inválido.',
      })
      .trim()
      .min(1, {
        error: 'O e-mail é obrigatório.',
      }),
    password: z.string().trim().min(6, {
      error: 'A senha deve ter no mínimo 6 caracteres.',
    }),
    passwordConfirmation: z.string().trim().min(6, {
      error: 'A confirmação de senha é obrigatória.',
    }),
    terms: z.boolean().refine((value) => value === true, {
      error: 'Você precisa aceitar os termos.',
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'As senhas não coincidem.',
    path: ['passwordConfirmation'],
  });
