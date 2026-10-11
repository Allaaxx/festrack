# ADR 0002: Reactive Session Invalidation and Deep-Link Route Restoration

## Status

Accepted (supersedes HTTP 401 interceptor redirect decision in ADR 0001)

## Context

In ADR 0001, the HTTP client configured a response interceptor that performed hard browser window redirects (`window.location.href = '/signin'`) upon encountering HTTP 401 Unauthorized responses. Additionally, unauthenticated visitors attempting to access protected routes were redirected to `/signin` without preserving their target destination, causing successful authentication to always dump users onto the default home dashboard. Furthermore, cold loads displayed an empty blank screen while initial session status was determined.

Hard window navigation breaks single-page application (SPA) state, abruptly discards in-flight requests, resets query client caches without graceful cache purges, and prevents smooth transitions. In a cookie-based session model managed by Better Auth, session state must be synchronized reactively with client state.

## Decision

We have updated the authentication error handling and route guard architecture:

1. **Decoupled HTTP 401 Invalidation via Event Listener:**
   Removed `window.location.href = '/signin'` from the Axios response interceptor. Replaced it with an event-driven `onUnauthorized` listener that notifies `AuthContext` to clear user credentials and purge the TanStack Query cache (`queryClient.clear()`) within the SPA lifecycle.
2. **Deep-Link Route State Preservation:**
   Updated `DashboardLayout` to capture the visitor's attempted `location` in navigation state (`<Navigate to="/signin" state={{ from: location }} replace />`).
3. **Destination Restoration across Auth Flows:**
   Updated `SignInPage` and `SignUpPage` to extract and sanitize the return destination via `getRedirectDestination(location.state?.from)`, restoring users to their intended route after email authentication or external Google OAuth completion.
4. **Accessible Initial Session Loading State:**
   Replaced empty `null` returns during initial session resolution (`isInitializing`) with a centered `<AuthLoading />` indicator rendering `<Loader2Icon className="animate-spin" />`.
5. **Defensive Null Safety in Domain Hooks:**
   Standardized domain query and mutation hooks across transactions and events with optional chaining (`user?.id`) and explicit boolean guards (`enabled: Boolean(user?.id)`).

## Consequences

- **User Experience:** Visitors are returned to the specific feature they requested after signing in or creating an account, and cold loads display clear visual feedback instead of blank flashes.
- **SPA Consistency:** 401 Unauthorized responses trigger smooth client-side React Router navigation rather than jarring browser reloads.
- **Cache Isolation:** Query client caches are cleared reliably upon 401 invalidation without leaking sensitive financial records.
- **Robustness:** Feature query hooks do not throw runtime exceptions when evaluating components during unauthenticated or transitioning states.
