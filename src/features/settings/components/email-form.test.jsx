import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateUser } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import EmailForm from '@/features/settings/components/email-form';

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/hooks/user', () => ({
  useUpdateUser: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('EmailForm Component', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' },
    });
    useUpdateUser.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it('renders current email address and disabled submit button when unchanged', () => {
    render(<EmailForm />);

    const input = screen.getByLabelText(/e-mail/i);
    expect(input).toHaveValue('test@example.com');

    const submitBtn = screen.getByRole('button', { name: /salvar e-mail/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button and calls update mutation when email is changed', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      id: 'u1',
      email: 'new@example.com',
    });

    render(<EmailForm />);

    const input = screen.getByLabelText(/e-mail/i);
    fireEvent.change(input, { target: { value: 'new@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /salvar e-mail/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'new@example.com',
      });
    });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'E-mail atualizado com sucesso!',
      })
    );
  });

  it('displays error toast when updating email fails', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('E-mail já está em uso'));

    render(<EmailForm />);

    const input = screen.getByLabelText(/e-mail/i);
    fireEvent.change(input, { target: { value: 'taken@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /salvar e-mail/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Erro ao atualizar e-mail',
          description: 'E-mail já está em uso',
        })
      );
    });
  });

  it('shows loading indicator when update is pending', () => {
    useUpdateUser.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
    });

    render(<EmailForm />);

    const submitBtn = screen.getByRole('button', { name: /salvar e-mail/i });
    expect(submitBtn).toBeDisabled();
  });
});
