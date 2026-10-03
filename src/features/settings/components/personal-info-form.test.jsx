import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUpdateProfile, useUploadAvatar } from '@/api/hooks/user';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import PersonalInfoForm from '@/features/settings/components/personal-info-form';

const mockUpdateProfileMutateAsync = vi.fn();
const mockUploadAvatarMutateAsync = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/contexts/auth', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('@/api/hooks/user', () => ({
  useUpdateProfile: vi.fn(),
  useUploadAvatar: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

describe('PersonalInfoForm Component', () => {
  const mockUser = {
    id: 'u1',
    name: 'Ana Silva',
    firstName: 'Ana',
    lastName: 'Silva',
    first_name: 'Ana',
    last_name: 'Silva',
    email: 'ana@example.com',
    image: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthContext.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
    });
    useUpdateProfile.mockReturnValue({
      mutateAsync: mockUpdateProfileMutateAsync,
      isPending: false,
    });
    useUploadAvatar.mockReturnValue({
      mutateAsync: mockUploadAvatarMutateAsync,
      isPending: false,
    });
  });

  it('correctly populates first name and last name from normalized user', () => {
    render(<PersonalInfoForm />);

    const firstNameInput = screen.getByLabelText('Nome');
    const lastNameInput = screen.getByLabelText('Sobrenome');

    expect(firstNameInput).toHaveValue('Ana');
    expect(lastNameInput).toHaveValue('Silva');
  });

  it('renders existing remote avatar when user has image', () => {
    useAuthContext.mockReturnValue({
      user: {
        ...mockUser,
        image: 'https://s3.amazonaws.com/festrack/avatars/user-1.png',
      },
      updateUser: mockUpdateUser,
    });

    render(<PersonalInfoForm />);

    const avatarImg = screen.getByAltText('Avatar do usuário');
    expect(avatarImg).toHaveAttribute(
      'src',
      'https://s3.amazonaws.com/festrack/avatars/user-1.png'
    );
  });

  it('submits updated names, calls updateUser, and triggers success toast', async () => {
    const updatedUser = {
      ...mockUser,
      firstName: 'Beatriz',
      lastName: 'Costa',
      name: 'Beatriz Costa',
    };
    mockUpdateProfileMutateAsync.mockResolvedValueOnce(updatedUser);

    render(<PersonalInfoForm />);

    const firstNameInput = screen.getByLabelText('Nome');
    const lastNameInput = screen.getByLabelText('Sobrenome');
    const submitBtn = screen.getByRole('button', {
      name: /salvar alterações/i,
    });

    fireEvent.change(firstNameInput, { target: { value: 'Beatriz' } });
    fireEvent.change(lastNameInput, { target: { value: 'Costa' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateProfileMutateAsync).toHaveBeenCalledWith({
        firstName: 'Beatriz',
        lastName: 'Costa',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Informações salvas com sucesso!',
        })
      );
    });
  });

  it('shows error toast when profile update fails', async () => {
    mockUpdateProfileMutateAsync.mockRejectedValueOnce(
      new Error('Erro na conexão')
    );

    render(<PersonalInfoForm />);

    const firstNameInput = screen.getByLabelText('Nome');
    const submitBtn = screen.getByRole('button', {
      name: /salvar alterações/i,
    });

    fireEvent.change(firstNameInput, { target: { value: 'Beatriz' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Erro ao atualizar perfil',
        })
      );
    });
  });

  it('renders loading state and disables submit button when mutation is pending', () => {
    useUpdateProfile.mockReturnValue({
      mutateAsync: mockUpdateProfileMutateAsync,
      isPending: true,
    });

    render(<PersonalInfoForm />);

    const submitBtn = screen.getByRole('button', { name: /salvando/i });
    expect(submitBtn).toBeDisabled();
  });

  describe('Avatar upload', () => {
    it('shows error toast when selected file exceeds 5MB', () => {
      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 5MB.',
        })
      );
      expect(mockUploadAvatarMutateAsync).not.toHaveBeenCalled();
    });

    it('shows error toast when selected file has unsupported MIME type', () => {
      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      const pdfFile = new File(['pdf-content'], 'doc.pdf', {
        type: 'application/pdf',
      });

      fireEvent.change(fileInput, { target: { files: [pdfFile] } });

      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Formato inválido',
        })
      );
      expect(mockUploadAvatarMutateAsync).not.toHaveBeenCalled();
    });

    it('uploads valid file immediately and updates user on success', async () => {
      const validFile = new File(['image-bytes'], 'avatar.webp', {
        type: 'image/webp',
      });
      const updatedUser = {
        ...mockUser,
        image: 'https://s3.amazonaws.com/festrack/avatars/user-1-new.webp',
      };
      mockUploadAvatarMutateAsync.mockResolvedValueOnce(updatedUser);

      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(mockUploadAvatarMutateAsync).toHaveBeenCalledWith(validFile);
        expect(mockUpdateUser).toHaveBeenCalledWith(updatedUser);
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'Avatar atualizado com sucesso!',
          })
        );
      });
    });

    it('shows error toast when avatar upload mutation fails', async () => {
      const validFile = new File(['image-bytes'], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      mockUploadAvatarMutateAsync.mockRejectedValueOnce(
        new Error('Falha no upload')
      );

      const { container } = render(<PersonalInfoForm />);
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [validFile] } });

      await waitFor(() => {
        expect(toast.add).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'Erro ao enviar avatar',
          })
        );
      });
    });

    it('renders loading spinner when avatar is uploading', () => {
      useUploadAvatar.mockReturnValue({
        mutateAsync: mockUploadAvatarMutateAsync,
        isPending: true,
      });

      render(<PersonalInfoForm />);

      expect(screen.getByTestId('avatar-loading-spinner')).toBeInTheDocument();
    });

    it('disables the remove button when no pending file is selected', () => {
      render(<PersonalInfoForm />);

      const removeBtn = screen.getByRole('button', { name: /remover avatar/i });
      expect(removeBtn).toBeDisabled();
    });
  });
});
