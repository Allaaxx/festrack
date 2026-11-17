# Festrack Domain Glossary

This document establishes the canonical domain vocabulary and terminology used across the Festrack frontend codebase and documentation.

---

### User

The primary account entity in Festrack representing an individual managing personal finances, events, and transactions.

- **Attributes:** Unique identifier (`id`), full display name (`name`), given name (`first_name` / `firstName`), family name (`last_name` / `lastName`), primary contact address (`email`), verification flag (`emailVerified`), and optional avatar (`image`).
- **Normalized Representation:** On the frontend, user entities are normalized through `normalizeUser` to simultaneously support camelCase and snake_case properties to ensure backward compatibility across features.

---

### Shop

The primary collaborative multi-tenant boundary in Festrack representing a business workspace or organization.

- **Scope:** All events, financial transactions, and aggregate balances belong strictly to a Shop.
- **Tenancy:** A User can own or belong to multiple Shops, switching active business contexts through the user interface.
- **Avoid:** Store, Empresa, Organization, Tenant.

---

### Shop Member

A validated association linking a User to a Shop with specific administrative permissions.

- **Roles:** Strictly categorized as `OWNER` (full administrative rights: editing details, deleting the shop, managing invitations, removing members, transferring ownership) or `MEMBER` (collaborator rights: viewing and creating events, transactions, and balances).
- **Avoid:** Collaborator, Participant.

---

### Shop Invitation

A time-bound authorization token issued to an email address allowing an invitee to join a Shop.

- **Lifecycle:** Issued by an `OWNER`, active for 7 days with status `PENDING`, and transitioning to `ACCEPTED`, `REVOKED`, or `EXPIRED`.
- **Identity Binding:** Acceptance strictly validates that the authenticated user's email matches the invited email address.
- **Avoid:** Convite, Invite.

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
- **Credential Provisioning:** Users who register or sign in via an external OAuth identity provider (e.g., Google) initially lack a password credential. Festrack enables on-demand credential provisioning (`setPassword`), allowing users to create a password without needing a previous one and transitioning the account to support dual authentication methods (SSO and password).
- **Credential Rotation:** Users with an existing password credential must provide their active password alongside their replacement secret (`changePassword`) to verify account ownership prior to updating credentials.

---

### Transaction

A single financial movement (earning, expense, or investment) associated with a user and optionally tied to a specific calendar event.

- **Types:** Categorized strictly as `EARNING` (Receita), `EXPENSE` (Despesa), or `INVESTMENT` (Investimento).
- **Date Semantics:** Recorded against a pure civil calendar date (`YYYY-MM-DD`) representing the financial competence day, independent of time-of-day or timezone offsets.
- **Event Association:** When tied to an Event, the transaction belongs to that event's financial ledger unconditionally, regardless of whether the transaction date falls within the event's start and end dates (e.g., advance purchases or post-event expenses).

---

### Finances

The aggregate financial management domain encompassing overall balance metrics, performance visualisations, and the ledger of transactions.

- **Scope:** Represents the holistic financial cockpit of a user, aggregating income, expenses, and investments.
- **Distinction from Transaction:** Represents the aggregate financial module and its indicators, whereas Transaction represents an atomic financial entry.

---

### Event

A scheduled occasion or budget bucket (e.g., travel, wedding, party) with start and end dates used to group related financial transactions.

- **Authorship:** Every event is attributed to the Shop Member (Author) who created it, preserving visibility across collaborative shops.
- **External Calendar Sync:** Calendar synchronization for a Shop is centralized on the Shop `OWNER`'s connected Google Calendar account, regardless of which Shop Member creates, updates, or removes the event.
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
- **Interface Decoupling:** Synchronization preference is configured exclusively within user settings (`Settings > Connected Accounts`). The calendar view is decoupled from sync preference controls, operating purely as an event planning surface while honoring the background sync preference.

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

---

### Attachment

A digital file (receipt, invoice, product image, or document) associated with a domain entity (Event, Transaction, Shop, Product, or User).

- **Scope:** In current iterations, file handling is specialized around User [`Avatar`](#avatar). Future capabilities expand attachments to Shop branding, Product catalogs, and Event documentation.
- **Handling:** Upload logic is decoupled from UI presentation; components handle local file selection, validation, and previews, delegating persistence to dedicated entity mutation endpoints.
- **Avoid:** FileAsset, UploadFile, MediaItem.

---

### Product

A salable, rentable, or serviceable offering created by a shop for customers.

- **Classifications:** Categorized strictly across `sale` (physical items with permanent stock deduction upon purchase), `rent` (physical items allocated during events and returned upon check-in), and `service` (non-physical offerings with no stock tracking).
- **Avoid:** Item, Article, Listing, Goods.

---

### Product Bundle (Pacote)

A composite product whose retail pricing and marketing presence are distinct, but whose availability and fulfillment are dynamically derived from a collection of component simple products rather than maintaining a dedicated physical stock. Referred to in the UI strictly as **Pacote**.

- **Bottleneck Inventory:** Stock availability is computed in real time from the minimum ratio of unreserved component inventory to required bundle quantities: $\min_i \lfloor (quantity_i - reserved_i) / multiplier_i \rfloor$.
- **Composition Constraints:** Bundles are strictly single-level (a bundle cannot contain another bundle), and both their metadata and component associations (`bundle_items`) can be edited by shop members.
- **Avoid:** Pacote Virtual, Kit, Combo, Grouped Product.

---

### Bundle Item

The association linking a Product Bundle to a required component simple Product alongside its multiplier quantity.

- **Integrity:** Component products referenced in active bundles are protected against deletion.
- **Avoid:** Component, Ingredient, Sub-item, Part.

---

### Stock

The physical inventory record tracking on-hand quantity and reserved allocations for a single simple product owned by a shop.

- **Attributes:** Total physical on-hand count (`quantity`) and current allocations for scheduled events or open checkouts (`reserved`).
- **Availability:** Calculated as `quantity - reserved`.
- **Applicability:** Maintained exclusively for simple products classified as `sale` or `rent`.
- **Avoid:** Inventory, Storage, Warehouse count.

---

### Stock Movement

An immutable ledger entry recording a discrete change or adjustment in a product's stock.

- **Movement Types:** Categorized as `INBOUND` (receipt of physical units), `SALE` (outbound fulfillment), `RENTAL_ALLOCATION` (temporary reservation for event), `RENTAL_RETURN` (physical check-in upon event conclusion), `LOSS` (write-off due to damage or disappearance during rental), and `ADJUSTMENT` (manual audit reconciliation).
- **Auditability:** Preserves timestamp, affected quantity, delta, user attribution, and optional reference to an Event or Inspection.
- **Avoid:** Stock Change, Adjustment Record, Inventory Log.

---

### Etiqueta (Event Tag)

A visual classification label or category assigned to an Event to organize, filter, and color-code scheduled occasions on the calendar.

- **Attributes:** Unique identifier or key (`value`), display title (`label`), and visual accent color (`dotClass` / `color`).
- **Origin:** Não existem etiquetas padrão ou de sistema. Toda etiqueta é criada sob demanda por um membro da Shop e pertence exclusivamente a ela.
- **Optionality:** A etiqueta de um Evento é opcional. Um Evento sem etiqueta (ou cuja etiqueta foi excluída) é exibido na cor neutra padrão do calendário (rosa).
- **Customization:** Shop members can create new tags and delete any tag within their workspace. Excluir uma etiqueta deixa seus Eventos sem etiqueta.
- **Filtering:** Filters event visibility across all calendar views (month, week, day, year, and agenda).
- **Avoid:** Category, EventType, Classificação, Label.





