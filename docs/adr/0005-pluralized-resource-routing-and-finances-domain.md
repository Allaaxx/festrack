# ADR 0005: Pluralized Resource Routing and Finances Domain Boundary

## Status

Accepted (Amends ADR 0004 regarding event routing)

## Context

Festrack previously routed event views under `/event` and the dedicated detail ledger under `/event/:eventId` (as recorded in ADR 0004), while the financial balance and transaction history resided under the root route `/` in a feature module named `transactions`.

To align with modern RESTful web routing conventions and reflect the expansion of the financial cockpit (integrating high-level balance cards, interactive trend charts, and the transactions ledger):
1. Routes for resources representing collections and individual members should use plural nouns (`/events`, `/events/:eventId`, `/finances`).
2. The root route `/` should consistently redirect to the primary financial cockpit `/finances`.
3. The feature module `transactions` is elevated to `finances` to represent the aggregate financial management domain, retaining `Transaction` as the atomic entity for individual ledger entries.

## Decision

1. **Pluralized Routing for Events:**
   - The primary events view is routed at `/events`.
   - The event detail view is routed at `/events/:eventId`.
   - Legacy routes (`/event`, `/event/:eventId`, `/event/card`, `/event/calendar`) preserve seamless backward compatibility by issuing instant client-side replacement redirects to `/events/*`.

2. **Finances Route and Root Redirection:**
   - The financial management page is registered at `/finances`.
   - The root path `/` performs an instant client-side replace redirect (`<Navigate to="/finances" replace />`) to `/finances`.

3. **Feature Domain Boundary Elevation:**
   - The feature slice is named `src/features/finances`, exposing the high-level financial dashboard components (`SectionCards`, `ChartAreaInteractive`) alongside transaction components (`TransactionsTable`, `AddTransactionButton`, `EditTransactionButton`, `Balance`).
   - Domain models, services, and queries continue to reference `Transaction` for individual financial movements.
