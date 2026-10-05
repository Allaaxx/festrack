import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '@/api/services/auth';
import { authClient } from '@/lib/auth-client';
import protectedApi from '@/lib/axios';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
  },
}));

vi.mock('@/lib/axios', () => {
  const mockProtectedApi = {
    get: vi.fn(),
  };
  return {
    default: mockProtectedApi,
    protectedApi: mockProtectedApi,
    publicApi: {},
  };
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('invokes authClient.signUp.email with mapped payload and returns normalized user', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      authClient.signUp.email.mockResolvedValue({
        data: {
          user: mockUser,
          token: 'token-123',
        },
        error: null,
      });

      const result = await AuthService.signup({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(result).toMatchObject({
        id: 'user-1',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });
    });

    it('throws error when authClient.signUp.email returns error', async () => {
      const mockError = new Error('Email already registered');
      authClient.signUp.email.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        AuthService.signup({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('signin', () => {
    it('invokes authClient.signIn.email and returns normalized user', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      authClient.signIn.email.mockResolvedValue({
        data: {
          user: mockUser,
          token: 'token-123',
        },
        error: null,
      });

      const result = await AuthService.signin({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result).toMatchObject({
        id: 'user-1',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });
    });

    it('throws error when authClient.signIn.email returns error', async () => {
      const mockError = new Error('Invalid credentials');
      authClient.signIn.email.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        AuthService.signin({
          email: 'john@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('me', () => {
    it('fetches /users/me and returns normalized user', async () => {
      protectedApi.get.mockResolvedValue({
        data: {
          id: 'user-1',
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
        },
      });

      const result = await AuthService.me();

      expect(protectedApi.get).toHaveBeenCalledWith('/users/me');
      expect(result).toMatchObject({
        id: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('calls authClient.signIn.social with google provider and default scopes', async () => {
      authClient.signIn.social = vi.fn().mockResolvedValue({
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
        error: null,
      });

      const result = await AuthService.signInWithGoogle();

      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/',
        scopes: ['openid', 'profile', 'email'],
      });
      expect(result).toEqual({
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
      });
    });

    it('throws error when authClient.signIn.social returns an error', async () => {
      authClient.signIn.social = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Falha na autenticação social'),
      });

      await expect(AuthService.signInWithGoogle()).rejects.toThrow(
        'Falha na autenticação social'
      );
    });
  });

  describe('linkSocial', () => {
    it('calls authClient.linkSocial with specified parameters', async () => {
      authClient.linkSocial = vi.fn().mockResolvedValue({
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
        error: null,
      });

      const result = await AuthService.linkSocial({
        provider: 'google',
        callbackURL: '/settings',
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
        additionalParams: { access_type: 'offline', prompt: 'consent' },
      });

      expect(authClient.linkSocial).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/settings',
        scopes: ['https://www.googleapis.com/auth/calendar.events'],
        additionalParams: { access_type: 'offline', prompt: 'consent' },
      });
      expect(result).toEqual({
        url: 'https://accounts.google.com/o/oauth2/v2/auth',
      });
    });

    it('throws error when authClient.linkSocial returns an error', async () => {
      authClient.linkSocial = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Falha ao vincular conta'),
      });

      await expect(
        AuthService.linkSocial({ provider: 'google' })
      ).rejects.toThrow('Falha ao vincular conta');
    });
  });
});
