import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveCallbackUrl } from '@/helpers/url';

describe('resolveCallbackUrl', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = new URL('http://localhost:5174/signin');
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.unstubAllEnvs();
  });

  it('resolves relative "/" to the frontend origin', () => {
    expect(resolveCallbackUrl('/')).toBe('http://localhost:5174/');
  });

  it('resolves relative path without leading slash', () => {
    expect(resolveCallbackUrl('dashboard')).toBe(
      'http://localhost:5174/dashboard'
    );
  });

  it('resolves relative path with query parameters', () => {
    expect(resolveCallbackUrl('/settings?tab=accounts')).toBe(
      'http://localhost:5174/settings?tab=accounts'
    );
  });

  it('defaults to "/" resolved against frontend origin when omitted or empty', () => {
    expect(resolveCallbackUrl()).toBe('http://localhost:5174/');
    expect(resolveCallbackUrl('')).toBe('http://localhost:5174/');
  });

  it('preserves absolute http/https URLs as-is', () => {
    expect(resolveCallbackUrl('https://example.com/callback')).toBe(
      'https://example.com/callback'
    );
    expect(resolveCallbackUrl('http://localhost:5174/overview')).toBe(
      'http://localhost:5174/overview'
    );
  });

  it('uses VITE_APP_URL when window is undefined', () => {
    delete window.location;
    vi.stubEnv('VITE_APP_URL', 'http://localhost:5174');

    expect(resolveCallbackUrl('/home')).toBe('http://localhost:5174/home');
  });
});
