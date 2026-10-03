import { describe, expect, it } from 'vitest';

import { authClient } from '@/lib/auth-client';

describe('Better Auth Client', () => {
  it('initializes authClient singleton with expected methods', () => {
    expect(authClient).toBeDefined();
    expect(typeof authClient.signIn.email).toBe('function');
    expect(typeof authClient.signUp.email).toBe('function');
    expect(typeof authClient.signOut).toBe('function');
    expect(typeof authClient.useSession).toBe('function');
  });
});
