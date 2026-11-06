import { describe, expect, it } from 'vitest';

import {
  getAuthErrorMessage,
  getOAuthErrorMessage,
  OAUTH_ERROR_MESSAGES,
} from '@/helpers/auth';

describe('OAuth Error Helpers', () => {
  describe('OAUTH_ERROR_MESSAGES', () => {
    it('defines localized messages for canonical OAuth error codes', () => {
      expect(OAUTH_ERROR_MESSAGES.state_mismatch).toBe(
        'A sessão de autenticação expirou ou é inválida. Por favor, tente novamente.'
      );
      expect(OAUTH_ERROR_MESSAGES.access_denied).toBe(
        'O acesso foi negado ou cancelado. Por favor, tente novamente.'
      );
      expect(OAUTH_ERROR_MESSAGES.oauth_link_error).toBe(
        'Não foi possível vincular a conta do Google. Verifique se o e-mail já está associado a outra conta.'
      );
    });
  });

  describe('getOAuthErrorMessage', () => {
    it('returns null when neither error nor error_description is provided', () => {
      expect(getOAuthErrorMessage()).toBeNull();
      expect(getOAuthErrorMessage(null, null)).toBeNull();
      expect(getOAuthErrorMessage('', '')).toBeNull();
    });

    it('translates state_mismatch error code to localized message', () => {
      const message = getOAuthErrorMessage('state_mismatch');
      expect(message).toBe(
        'A sessão de autenticação expirou ou é inválida. Por favor, tente novamente.'
      );
    });

    it('translates access_denied error code to localized message', () => {
      const message = getOAuthErrorMessage('access_denied');
      expect(message).toBe(
        'O acesso foi negado ou cancelado. Por favor, tente novamente.'
      );
    });

    it('translates oauth_link_error error code to localized message', () => {
      const message = getOAuthErrorMessage('oauth_link_error');
      expect(message).toBe(
        'Não foi possível vincular a conta do Google. Verifique se o e-mail já está associado a outra conta.'
      );
    });

    it('handles uppercase or mixed-case error codes correctly', () => {
      expect(getOAuthErrorMessage('STATE_MISMATCH')).toBe(
        'A sessão de autenticação expirou ou é inválida. Por favor, tente novamente.'
      );
      expect(getOAuthErrorMessage('Access_Denied')).toBe(
        'O acesso foi negado ou cancelado. Por favor, tente novamente.'
      );
    });

    it('prioritizes canonical translation even when error_description is provided', () => {
      const message = getOAuthErrorMessage(
        'state_mismatch',
        'State cookie missing or invalid'
      );
      expect(message).toBe(
        'A sessão de autenticação expirou ou é inválida. Por favor, tente novamente.'
      );
    });

    it('falls back to error_description for unknown error codes', () => {
      const message = getOAuthErrorMessage(
        'unsupported_response_type',
        'O tipo de resposta não é suportado pelo provedor.'
      );
      expect(message).toBe('O tipo de resposta não é suportado pelo provedor.');
    });

    it('returns default localized message for unknown error code without description', () => {
      const message = getOAuthErrorMessage('unknown_oauth_code');
      expect(message).toBe(
        'Ocorreu um erro durante a autenticação social. Por favor, tente novamente.'
      );
    });

    it('returns error_description when error code is missing but description is present', () => {
      const message = getOAuthErrorMessage(
        null,
        'Falha temporária de comunicação com o Google.'
      );
      expect(message).toBe('Falha temporária de comunicação com o Google.');
    });
  });

  describe('getAuthErrorMessage', () => {
    it('translates "Failed to fetch" into a friendly Portuguese network message', () => {
      expect(getAuthErrorMessage(new Error('Failed to fetch'))).toBe(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
      );
      expect(getAuthErrorMessage({ message: 'failed to fetch' })).toBe(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
      );
    });

    it('translates generic network errors into a friendly message', () => {
      expect(
        getAuthErrorMessage('NetworkError when attempting to fetch resource.')
      ).toBe(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
      );
      expect(getAuthErrorMessage({ message: 'ERR_CONNECTION_REFUSED' })).toBe(
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
      );
    });

    it('preserves specific domain error messages', () => {
      expect(
        getAuthErrorMessage(new Error('E-mail ou senha incorretos.'))
      ).toBe('E-mail ou senha incorretos.');
      expect(getAuthErrorMessage('Este e-mail já está em uso.')).toBe(
        'Este e-mail já está em uso.'
      );
    });

    it('falls back to custom fallback or default message when error is empty', () => {
      expect(
        getAuthErrorMessage(null, 'Mensagem customizada de fallback')
      ).toBe('Mensagem customizada de fallback');
      expect(getAuthErrorMessage(undefined)).toBe(
        'Ocorreu um erro ao processar sua solicitação. Tente novamente.'
      );
    });
  });
});
