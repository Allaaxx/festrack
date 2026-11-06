import { describe, expect, it } from 'vitest';

import { signInFormSchema, signUpFormSchema } from '@/forms/schemas/auth';

describe('Auth Schemas', () => {
  describe('signInFormSchema', () => {
    it('rejects passwords shorter than 6 characters with correct Portuguese spelling', () => {
      const result = signInFormSchema.safeParse({
        email: 'user@example.com',
        password: '123',
      });

      expect(result.success).toBe(false);
      const passwordError = result.error.issues.find((issue) =>
        issue.path.includes('password')
      );
      expect(passwordError?.message).toBe(
        'A senha deve ter no mínimo 6 caracteres.'
      );
    });

    it('accepts valid credentials', () => {
      const result = signInFormSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('signUpFormSchema', () => {
    it('rejects passwords shorter than 6 characters with correct Portuguese spelling', () => {
      const result = signUpFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@example.com',
        password: '123',
        passwordConfirmation: '123',
        terms: true,
      });

      expect(result.success).toBe(false);
      const passwordError = result.error.issues.find((issue) =>
        issue.path.includes('password')
      );
      expect(passwordError?.message).toBe(
        'A senha deve ter no mínimo 6 caracteres.'
      );
    });
  });
});
