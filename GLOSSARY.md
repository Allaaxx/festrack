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

---

### Event

A scheduled occasion or budget bucket (e.g., travel, wedding, party) with start and end dates used to group related financial transactions.

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

