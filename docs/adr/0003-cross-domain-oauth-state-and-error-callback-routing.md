# ADR 0003: Cross-Domain OAuth State Cookie Handling and Frontend Error Callback Routing

## Status

Accepted

## Context

In production environments, Festrack deploys the client single-page application on Vercel and the backend API service (`festrack-api`) on Render across distinct domains. During Google OAuth social authentication, the browser traverses multiple cross-origin redirects:

1. The frontend initiates social sign-in against the API (`POST /api/auth/sign-in/social`).
2. The API sets an OAuth state verification cookie (`better-auth.state`) and returns the Google OAuth consent URL.
3. The user consents on Google and is redirected back to the API callback route (`GET /api/auth/callback/google`).
4. The API verifies the returned OAuth state parameter against the `better-auth.state` cookie.

Under Better Auth's default cookie configuration, cookies were emitted with `SameSite=Lax`. When returning from the third-party Google authorization origin to the Render API origin, modern browser cross-site tracking protections (such as Chromium partitioned cookies and Safari ITP) drop or withhold the `better-auth.state` cookie. This caused immediate `state_mismatch` validation failures.

Furthermore, two compounding design gaps stranded users:
1. **API Origin Fallback:** Because the frontend did not pass an explicit `errorCallbackURL` when initiating social authentication, Better Auth fell back to redirecting to the API's base URL (`https://finance-app-i54o.onrender.com/?error=state_mismatch`), leaving users stuck outside the application interface on an unrendered API domain.
2. **Missing Localized Error Feedback:** When redirected back to the frontend, authentication routes (`/signin`) did not parse query error parameters, presenting an empty form without explaining why authentication failed.

## Decision

We have updated the cross-domain OAuth authentication architecture across the backend and frontend:

1. **Production Cross-Site Cookie Attributes (Backend API):**
   Configured Better Auth's `advanced.defaultCookieAttributes` with `sameSite: 'none'`, `secure: true`, and `httpOnly: true` when running in production (`NODE_ENV === 'production'`). Set `useSecureCookies: true` in production. In development and test environments (`NODE_ENV !== 'production'`), cookies retain `sameSite: 'lax'` and `secure: false` over unencrypted HTTP `localhost`.

2. **Frontend OAuth Error Callback Normalization:**
   Enhanced `AuthService.signInWithGoogle` to default `errorCallbackURL` to `/signin` through the existing `resolveCallbackUrl` helper. This guarantees that the API always receives a fully qualified, absolute frontend destination URL for error redirections.

3. **Authentication Pages OAuth Error Interception:**
   Updated `SignInPage` to inspect URL search parameters for `error` and `error_description` upon mount and location change. Canonical OAuth error codes are translated to clear, accessible Portuguese (BR) messages displayed in the root form alert (`FieldError` with `role="alert"`):
   - `state_mismatch`: "A sessão de autenticação expirou ou é inválida. Por favor, tente novamente."
   - `access_denied`: "O acesso foi negado ou cancelado. Por favor, tente novamente."
   - `oauth_link_error`: "Não foi possível vincular a conta do Google. Verifique se o e-mail já está associado a outra conta."

## Considered Alternatives

- **Database-Only State Storage (Session Verification Tables):**
  Instead of cookie-based state verification, store temporary OAuth state identifiers in a PostgreSQL table with short TTLs.
  *Rejected:* Adds redundant database writes, increases database connection pool pressure, complicates schema migrations, and requires background cleanup workers for expired states without eliminating the need for cross-domain session cookies post-authentication.

- **Unified Single-Domain Reverse Proxy (Cloudflare / Vercel Rewrites):**
  Route `/api/*` to the Render backend and `/*` to the Vercel frontend under a single unified domain (e.g., `app.festrack.com`).
  *Deferred / Out of Scope:* While an effective long-term architecture that avoids third-party cookie restrictions altogether, it requires custom DNS configuration, external infrastructure provisioning, and ingress bandwidth overhead that introduces operational complexity beyond the scope of application-level authentication fixes.

## Consequences

- **Cross-Origin Reliability:** Production OAuth state verification cookies survive navigation across Vercel, Google, and Render without `state_mismatch` errors.
- **Resilient Error Recovery:** OAuth provider errors or user cancellations reliably redirect users back to the frontend sign-in screen rather than stranding them on the API origin.
- **Accessible User Feedback:** Clear, localized Portuguese (BR) error alerts inform users of specific OAuth issues and enable prompt retry.
- **Local Development Continuity:** Developers continue running frontend and API locally over HTTP without needing local SSL certificates or browser flag overrides.
