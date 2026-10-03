import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuthContext } from '@/contexts/auth';
import PersonalInfoForm from '@/features/settings/components/personal-info-form';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

describe('PersonalInfoForm Component', () => {
  it('correctly populates first name and last name from normalized user', () => {
    useAuthContext.mockReturnValue({
      user: {
        id: 'u1',
        name: 'Ana Silva',
        firstName: 'Ana',
        lastName: 'Silva',
        first_name: 'Ana',
        last_name: 'Silva',
        email: 'ana@example.com',
      },
    });

    render(<PersonalInfoForm />);

    const firstNameInput = screen.getByLabelText('Nome');
    const lastNameInput = screen.getByLabelText('Sobrenome');

    expect(firstNameInput).toHaveValue('Ana');
    expect(lastNameInput).toHaveValue('Silva');
  });
});
