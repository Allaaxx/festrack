# ADR 0001: Migrate Frontend Authentication to Better Auth Client

## Status

Accepted

## Context

The backend service (`festrack-api`) migrated its authentication infrastructure from custom JWT authentication with bearer tokens to Better Auth, utilizing server-managed sessions stored in relational tables and transported via secure, HTTP-only cookies.

Previously, the frontend application stored access and refresh tokens in browser `localStorage`, attached them via Axios request interceptors, and attempted token refreshes against deprecated endpoints (`/auth/refresh-token`). This architecture introduced several issues:

1. Vulnerability to cross-site scripting (XSS) attacks by keeping bearer tokens accessible to client JavaScript.
2. Inability to instantly revoke active sessions from the server upon logout.
3. Lack of multi-tab reactive session synchronization.
4. Redundant, complex token refresh and retry interceptor code.

## Decision

We have migrated the authentication architecture of Festrack to the official Better Auth client:

1. **Better Auth Client Singleton:**
   Installed `better-auth` and initialized an authentication client singleton (`src/lib/auth-client.js`) using `createAuthClient` from `better-auth/react`, pointing to the API URL (`/api/auth` path prefix).

2. **HTTP Transport & Cookie-Based Credentials:**
   Configured Axios instances (`protectedApi` and `publicApi`) with `withCredentials: true`. Removed legacy `localStorage` token reading and refresh token retry logic. Added a 401 response interceptor that redirects unauthenticated users to `/signin` while avoiding redirect loops on auth pages.

3. **Reactive Session Lifecycle:**
   Connected `AuthContext` to Better Auth's reactive session state via `authClient.useSession()`. Synchronized user state automatically across tabs and components.

4. **Normalized User Entity:**
   Created `normalizeUser` to ensure the active user object simultaneously exposes camelCase (`firstName`, `lastName`) and snake_case (`first_name`, `last_name`) alongside `id`, `name`, and `email`. This preserves full backward compatibility with existing feature components and forms.

5. **Secure Sign-Out and Cache Sanitization:**
   Implemented sign-out that calls `authClient.signOut()`, purges sensitive financial data from the TanStack Query client cache using `queryClient.clear()`, and resets local user state.

6. **Decommissioned Legacy Artifacts:**
   Removed `LOCAL_STORAGE_ACCESS_TOKEN_KEY` and `LOCAL_STORAGE_REFRESH_TOKEN_KEY` from `src/constants/local-storage.js` and removed token management logic across the codebase.

## Consequences

- **Security:** Tokens are stored in HTTP-only, SameSite cookies inaccessible to client scripts, mitigating XSS token theft.
- **Reliability:** Reactive session state is managed by Better Auth, ensuring consistent auth status across browser tabs.
- **Cache Isolation:** Purging TanStack Query cache on sign-out guarantees financial records and balances cannot leak between users on shared devices.
- **Compatibility:** User normalization eliminates breaking changes for existing components expecting either naming convention.
