import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import protectedApi, { publicApi } from '@/lib/axios';

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

  it('redirects to /signin on 401 error when not already on auth routes', async () => {
    const error401 = {
      response: { status: 401, data: { message: 'Unauthorized' } },
      config: {},
    };

    await expect(
      protectedApi.interceptors.response.handlers[0].rejected(error401)
    ).rejects.toEqual(error401);

    expect(window.location.href).toBe('/signin');
  });

  it('does not redirect to /signin on 401 if already on /signin or /signup', async () => {
    window.location.pathname = '/signin';
    window.location.href = 'http://localhost:3000/signin';

    const error401 = {
      response: { status: 401, data: { message: 'Invalid credentials' } },
      config: {},
    };

    await expect(
      protectedApi.interceptors.response.handlers[0].rejected(error401)
    ).rejects.toEqual(error401);

    expect(window.location.href).toBe('http://localhost:3000/signin');

    window.location.pathname = '/signup';
    window.location.href = 'http://localhost:3000/signup';

    await expect(
      protectedApi.interceptors.response.handlers[0].rejected(error401)
    ).rejects.toEqual(error401);

    expect(window.location.href).toBe('http://localhost:3000/signup');
  });

  it('does not redirect on non-401 errors', async () => {
    const error500 = {
      response: { status: 500, data: { message: 'Internal Server Error' } },
      config: {},
    };

    await expect(
      protectedApi.interceptors.response.handlers[0].rejected(error500)
    ).rejects.toEqual(error500);

    expect(window.location.href).toBe('http://localhost:3000/dashboard');
  });
});
