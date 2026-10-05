import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserService } from '@/api/services/user';
import protectedApi from '@/lib/axios';

vi.mock('@/lib/axios', () => {
  const mockProtectedApi = {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: mockProtectedApi,
    protectedApi: mockProtectedApi,
    publicApi: {},
  };
});

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('sends PATCH to /users/me with mapped snake_case fields and returns normalized user', async () => {
      const mockResponse = {
        id: 'user-1',
        name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      };

      protectedApi.patch.mockResolvedValue({
        data: mockResponse,
      });

      const result = await UserService.updateProfile({
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(protectedApi.patch).toHaveBeenCalledWith('/users/me', {
        first_name: 'Jane',
        last_name: 'Smith',
      });

      expect(result).toMatchObject({
        id: 'user-1',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      });
    });

    it('propagates errors when API call fails', async () => {
      const mockError = new Error('Network error');
      protectedApi.patch.mockRejectedValue(mockError);

      await expect(
        UserService.updateProfile({
          firstName: 'Jane',
          lastName: 'Smith',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('uploadAvatar', () => {
    it('sends POST to /users/me/avatar with FormData containing avatar file and returns normalized user', async () => {
      const mockFile = new File(['dummy-image-content'], 'avatar.png', {
        type: 'image/png',
      });

      const mockResponse = {
        id: 'user-1',
        name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        image: 'https://s3.amazonaws.com/festrack/avatars/user-1.png',
      };

      protectedApi.post.mockResolvedValue({
        data: mockResponse,
      });

      const result = await UserService.uploadAvatar(mockFile);

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/users/me/avatar',
        expect.any(FormData)
      );

      const postedFormData = protectedApi.post.mock.calls[0][1];
      expect(postedFormData.get('avatar')).toBe(mockFile);

      expect(result).toMatchObject({
        id: 'user-1',
        name: 'Jane Smith',
        image: 'https://s3.amazonaws.com/festrack/avatars/user-1.png',
      });
    });

    it('propagates errors when avatar upload fails', async () => {
      const mockFile = new File([''], 'avatar.png', { type: 'image/png' });
      const mockError = new Error('Upload failed');
      protectedApi.post.mockRejectedValue(mockError);

      await expect(UserService.uploadAvatar(mockFile)).rejects.toThrow(
        'Upload failed'
      );
    });
  });

  describe('getAccounts', () => {
    it('sends GET to /users/me/accounts and returns list of connected accounts', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          providerId: 'credential',
          createdAt: '2026-10-01T00:00:00.000Z',
        },
        {
          id: 'acc-2',
          providerId: 'google',
          createdAt: '2026-10-02T00:00:00.000Z',
        },
      ];

      protectedApi.get.mockResolvedValue({
        data: mockAccounts,
      });

      const result = await UserService.getAccounts();

      expect(protectedApi.get).toHaveBeenCalledWith('/users/me/accounts');
      expect(result).toEqual(mockAccounts);
    });

    it('propagates errors when fetching accounts fails', async () => {
      protectedApi.get.mockRejectedValue(new Error('Erro ao buscar contas'));

      await expect(UserService.getAccounts()).rejects.toThrow(
        'Erro ao buscar contas'
      );
    });
  });

  describe('unlinkAccount', () => {
    it('sends POST to /users/me/accounts/unlink with providerId and returns response', async () => {
      const mockResponse = {
        success: true,
        message: 'Provider google unlinked successfully.',
      };

      protectedApi.post.mockResolvedValue({
        data: mockResponse,
      });

      const result = await UserService.unlinkAccount({ providerId: 'google' });

      expect(protectedApi.post).toHaveBeenCalledWith(
        '/users/me/accounts/unlink',
        {
          providerId: 'google',
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('propagates errors when unlinking fails', async () => {
      protectedApi.post.mockRejectedValue(
        new Error('Cannot unlink your only login method.')
      );

      await expect(
        UserService.unlinkAccount({ providerId: 'google' })
      ).rejects.toThrow('Cannot unlink your only login method.');
    });
  });
});
