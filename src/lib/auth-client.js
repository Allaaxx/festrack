import { createAuthClient } from 'better-auth/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export default authClient;
