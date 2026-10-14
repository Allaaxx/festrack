# Festrack Domain Glossary

This document establishes the canonical domain vocabulary and terminology used across the Festrack frontend codebase and documentation.

---

### User

The primary account entity in Festrack representing an individual managing personal finances, events, and transactions.

- **Attributes:** Unique identifier (`id`), full display name (`name`), given name (`first_name` / `firstName`), family name (`last_name` / `lastName`), primary contact address (`email`), verification flag (`emailVerified`), and optional avatar (`image`).
- **Normalized Representation:** On the frontend, user entities are normalized through `normalizeUser` to simultaneously support camelCase and snake_case properties to ensure backward compatibility across features.

---

### Session

A continuous period of authenticated interaction between a client device and the Festrack server.

- **Lifecycle:** Created upon successful sign-in or sign-up, continuously synchronized reactively across tabs via Better Auth (`authClient.useSession()`), and terminated upon explicit sign-out or session expiration.
- **Transport:** Identified and transported securely via an HTTP-only, SameSite cookie (`better-auth.session_token`). The raw session token is managed by the browser and inaccessible to client-side scripts.

---

### Credentials

The confidential identity proofs supplied by a user to authenticate against the server.

- **Usage:** Primarily email address and plaintext password submitted over HTTPS during sign-up or sign-in.
- **Handling:** Passwords are never stored on the client and are securely hashed on the server. Client-side authentication hooks handle credentials only in memory during form submission.

---

### Transaction

A single financial movement (earning, expense, or investment) associated with a user and optionally tied to a specific calendar event.

- **Types:** Categorized strictly as `EARNING` (Receita), `EXPENSE` (Despesa), or `INVESTMENT` (Investimento).
- **Event Association:** When tied to an Event, the transaction belongs to that event's financial ledger unconditionally, regardless of whether the transaction date falls within the event's start and end dates (e.g., advance purchases or post-event expenses).

---

### Event

A scheduled occasion or budget bucket (e.g., travel, wedding, party) with start and end dates used to group related financial transactions.

- **Financial Scope:** Acts as an aggregate financial container. Transactions linked to an event are grouped by event identity rather than restricted to its active calendar timeframe.

---

### Avatar

A graphical profile image representing a user, hosted in cloud storage and referenced by a secure URL in the user's profile entity (`image`).

- **Constraints:** Accepted MIME types are `image/jpeg`, `image/png`, and `image/webp`, with a maximum payload size of 5 MB.
- **Lifecycle:** Uploaded via a multipart form data endpoint (`POST /api/users/me/avatar`). Upon successful processing, the user's profile URL is refreshed and reflected immediately across the user interface.

---

### Connected Account

An external third-party identity and authorization provider (e.g., Google) linked to a user's Festrack profile.

- **Capabilities:** Enables single sign-on (SSO), credential-less authentication, and authorized delegation of third-party API capabilities.
- **Management:** Users can inspect linked accounts (`GET /api/users/me/accounts`), connect new providers, or revoke linkings (`POST /api/users/me/accounts/unlink`).

---

### Calendar Synchronization

The automated service bridging Festrack events with an external calendar service (Google Calendar).

- **Direction:** Export-oriented (Festrack ➡️ Google Calendar), pushing scheduled budget and occasion events to the user's external calendar.
- **Trigger:** Automated synchronization on event lifecycle mutations (creation, modification, and removal).

---

### Unauthenticated Visitor

An individual accessing application routes without an established active Session.

- **Routing:** Unauthenticated visitors accessing protected application routes are redirected to the sign-in screen with their requested destination recorded in navigation state.
- **Data Protection:** Feature queries remain disabled when evaluating unauthenticated contexts, preventing unauthorized network dispatches and protecting private endpoints.

---

### Expired Session

A previously valid Session that has been terminated, revoked, or timed out on the authentication server.

- **Handling:** When protected API endpoints return HTTP 401 Unauthorized due to an expired session, the client invalidates local user state, clears sensitive financial records from the query cache, and smoothly transitions the user to re-authenticate without hard browser reloads.
- **Recovery:** Preserves the user's active page as the post-authentication redirect destination, allowing uninterrupted continuation of their workflow upon re-signing in.

---

### OAuth State

An ephemeral cryptographic token generated during social authentication handshakes (e.g., Google OAuth) to verify transaction authenticity and defend against Cross-Site Request Forgery (CSRF).

- **Lifecycle:** Created when initiating social sign-in (`AuthService.signInWithGoogle`), serialized into a temporary verification cookie (`better-auth.state`), and validated by the backend authentication engine upon receiving the authorization callback.
- **Security Constraints:** Must be single-use, time-bound, and preserved across cross-domain redirects between the frontend, the identity provider, and the API. If the state cookie is absent or mismatched upon callback, a `state_mismatch` error is triggered.

---

### Cross-Site Cookie

An HTTP cookie transmitted in requests traversing distinct domain or origin boundaries (e.g., frontend on Vercel navigating to backend API on Render).

- **Production Requirements:** Modern web browsers enforce strict third-party cookie restrictions. In cross-domain deployments, authentication and state verification cookies must configure `SameSite=None`, `Secure=true`, and `HttpOnly=true` so they are not rejected during cross-site redirects.
- **Development Parity:** In local development environments running over unencrypted HTTP (`localhost`), cookies use `SameSite=Lax` and `Secure=false` to support local workflows without requiring TLS certificates.



