import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import protectedApi, {
  notifyUnauthorized,
  onUnauthorized,
  publicApi,
} from '@/lib/axios';

describe('Axios HTTP Client', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = {
      href: 'http://localhost:3000/dashboard',
      pathname: '/dashboard',
    };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.restoreAllMocks();
  });

  it('configures withCredentials to true for both protected and public APIs', () => {
    expect(protectedApi.defaults.withCredentials).toBe(true);
    expect(publicApi.defaults.withCredentials).toBe(true);
  });

  it('invokes onUnauthorized listener and does not perform hard browser redirect on 401', async () => {
    const mockListener = vi.fn();
    const unsubscribe = onUnauthorized(mockListener);

    const error401 = {
      response: { status: 401, data: { message: 'Unauthorized' } },
      config: {},
    };

    await expect(
      protectedApi.interceptors.response.handlers[0].rejected(error401)
    ).rejects.toEqual(error401);

    expect(mockListener).toHaveBeenCalledWith(error401);
    expect(window.location.href).toBe('http://localhost:3000/dashboard');

    unsubscribe();
  });

  it('does not invoke onUnauthorized on non-401 errors', async () => {
    const mockListener = vi.fn();
    const unsubscribe = onUnauthorized(mockListener);

    const error500 = {
      response: { status: 500, data: { message: 'Internal Server Error' } },
      config: {},
    };

    await expect(
      protectedApi.interceptors.response.handlers[0].rejected(error500)
    ).rejects.toEqual(error500);

    expect(mockListener).not.toHaveBeenCalled();
    expect(window.location.href).toBe('http://localhost:3000/dashboard');

    unsubscribe();
  });

  it('unsubscribing removes the listener from notification', () => {
    const mockListener = vi.fn();
    const unsubscribe = onUnauthorized(mockListener);

    unsubscribe();

    notifyUnauthorized({ response: { status: 401 } });
    expect(mockListener).not.toHaveBeenCalled();
  });
});
