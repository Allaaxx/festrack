/**
 * Mapeamento de códigos canônicos de erro de autenticação OAuth para mensagens
 * amigáveis e localizadas em Português (BR).
 */
export const OAUTH_ERROR_MESSAGES = {
  state_mismatch:
    'A sessão de autenticação expirou ou é inválida. Por favor, tente novamente.',
  access_denied:
    'O acesso foi negado ou cancelado. Por favor, tente novamente.',
  oauth_link_error:
    'Não foi possível vincular a conta do Google. Verifique se o e-mail já está associado a outra conta.',
};

/**
 * Traduz parâmetros de erro retornados em callbacks OAuth para mensagens
 * em Português (BR).
 *
 * @param {string|null} [error] - Código canônico do erro (ex: state_mismatch, access_denied).
 * @param {string|null} [errorDescription] - Descrição opcional retornada pelo provedor.
 * @returns {string|null} Mensagem de erro traduzida ou null se nenhum erro foi fornecido.
 */
export const getOAuthErrorMessage = (error, errorDescription) => {
  const normalizedError = error?.trim()?.toLowerCase();
  const trimmedDescription = errorDescription?.trim();

  if (!normalizedError && !trimmedDescription) {
    return null;
  }

  if (normalizedError && OAUTH_ERROR_MESSAGES[normalizedError]) {
    return OAUTH_ERROR_MESSAGES[normalizedError];
  }

  if (trimmedDescription) {
    return trimmedDescription;
  }

  return 'Ocorreu um erro durante a autenticação social. Por favor, tente novamente.';
};
