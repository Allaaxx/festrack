/**
 * Resolves a callback URL to an absolute URL based on the frontend origin.
 * This prevents social OAuth flows from redirecting users to the backend API origin
 * instead of the frontend application.
 *
 * @param {string} [callbackURL='/'] - Relative path or absolute URL.
 * @returns {string} Fully qualified callback URL.
 */
export const resolveCallbackUrl = (callbackURL = '/') => {
  const urlToResolve = callbackURL || '/';

  try {
    const baseOrigin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : import.meta.env?.VITE_APP_URL;

    if (baseOrigin) {
      return new URL(urlToResolve, baseOrigin).toString();
    }
  } catch {
    // Retorna o valor original caso a resolução da URL falhe
  }

  return urlToResolve;
};
