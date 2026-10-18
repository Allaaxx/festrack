# ADR 0007: Unified Transaction Ledger Component and Feature Parity

## Status

Accepted (Builds upon ADR 0004, ADR 0005, and ADR 0006)

## Context

In Festrack, transactions are displayed both on the aggregate financial cockpit (`/finances`) and within individual event detail dashboards (`/events/:eventId`).

Historically, these two presentations evolved separately:
1. `TransactionsTable` in `src/features/finances` was enhanced in ADR 0006 to provide comprehensive interactive capabilities: text search filtering, user-persisted column customization, row-click detail drawers with edit/delete triggers, and TanStack Table v9 paginated row models.
2. `EventTransactionsTable` in `src/features/events`, established in ADR 0004, relied on a rudimentary data table primitive (`src/components/ui/data-table.jsx`) inside a fixed-height scroll container without search, pagination, drawer details, or column customization.
3. This discrepancy produced severe UX asymmetry, duplicated rendering logic, and left obsolete template code (`sortable-data-table.jsx`), generic primitives (`data-table.jsx`), and superseded pages (`home.jsx`) orphaned in the repository.

## Decision

We have unified the transaction ledger architecture across the entire application:

1. **Canonical Component in Finances Domain (`TransactionsTable`):**
   - The transaction table in `src/features/finances/components/transactions-table.jsx` is established as the single canonical component for transaction ledger presentation.
   - It accepts an optional `eventId` parameter. When supplied without explicit `transactions` data, it automatically queries event-scoped records via `useGetTransactions({ eventId })` rather than calendar date windows.
   - The primary action trigger (`AddTransactionButton`) automatically receives `initialEventId={eventId}` to pre-populate new entries with the active event context.
   - The component strictly omits internal `<h2>` headings, relying on a clean toolbar layout (search, customize columns, and action triggers).

2. **Thin Facade in Events Domain (`EventTransactionsTable`):**
   - To respect Feature-First vertical slice boundaries and prevent breaking changes for consumers of `src/features/events`, `EventTransactionsTable` is preserved as a lightweight adapter that forward-delegates all props to `TransactionsTable`.

3. **Complete Feature Parity:**
   - The event detail view (`/events/:eventId`) gains full parity with the main financial cockpit, including real-time text search, customizable and persistent column visibility, row-click transaction detail drawers, and responsive client-side pagination.

4. **Codebase Cleanliness and Deprecation:**
   - Deleted unused prototype template `src/components/shared/sortable-data-table.jsx`.
   - Deleted obsolete generic primitive `src/components/ui/data-table.jsx`.
   - Deleted legacy route page `src/pages/home.jsx` (redirected to `/finances` by ADR 0005).
   - Removed redundant alias `DataTable` export from `src/features/finances/index.js`.

## Considered Alternatives

- **Shared Composite Component (`src/components/shared/transactions-table.jsx`):**
  *Rejected:* Violates Feature-First domain boundaries. Transactions represent a core business domain entity (`Transaction`), not a generic UI primitive.
- **Independent Maintenance with Duplicated Features:**
  *Rejected:* High maintenance cost, divergent UI/UX behavior, and double effort for future ledger enhancements or bug fixes.
- **Removing `EventTransactionsTable` completely from `events`:**
  *Rejected:* Direct cross-domain deep imports from feature pages would weaken vertical slice encapsulation. Retaining a thin facade provides clean abstraction with zero duplication.

## Consequences

- Consistent and polished user experience across both global finances and event detail ledgers.
- 100% DRY ledger presentation logic; improvements to `TransactionsTable` immediately benefit all application views.
- Clean and decoupled code base with dead mockups and deprecated pages purged.
- Preserved test coverage and CI reliability with high-seam end-to-end integration tests.
