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
