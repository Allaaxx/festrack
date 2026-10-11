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

const isSafePath = (path) => {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.startsWith('/signin') &&
    !path.startsWith('/signup')
  );
};

/**
 * Safely extracts and formats the intended return path from a navigation location object or string.
 * Prevents open redirects or redirect loops onto authentication routes.
 *
 * @param {object|string} [from] - React Router location object or path string.
 * @returns {string} Sanitized relative destination path (defaults to '/').
 */
export const getRedirectDestination = (from) => {
  if (!from) return '/';

  if (typeof from === 'string') {
    return isSafePath(from) ? from : '/';
  }

  const pathname = from.pathname;
  if (!isSafePath(pathname)) {
    return '/';
  }

  const search = from.search || '';
  const hash = from.hash || '';
  return `${pathname}${search}${hash}`;
};
