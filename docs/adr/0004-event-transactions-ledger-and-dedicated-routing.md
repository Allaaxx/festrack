# ADR 0004: Event Transactions Ledger and Dedicated Routing

## Status

Accepted

## Context

In Festrack, events represent scheduled occasions or budget buckets (e.g., travel, weddings, parties, renovation projects) defined with start and end dates. Users need to track income, expenses, and investments tied to these events to monitor their financial balance.

Previously, transaction queries in the application were strictly bound to calendar date intervals using `from` and `to` query parameters (typically matching a selected month or week). There was no mechanism to query transactions by event association, nor was there a dedicated dashboard to inspect or manage the aggregate financial ledger of a specific event.

In practical financial management, transactions associated with an event frequently occur outside the event's calendar duration:
- **Advance purchases:** Plane tickets, hotel reservations, venue deposits, or party supplies paid weeks or months before the event starts.
- **Post-event reconciliations:** Shared expense reimbursements, vendor final invoices, or cleanup fees settled days or weeks after the event ends.

Constraining event transaction queries to the event's calendar date window (`start_date` to `end_date`) breaks real-world accounting workflows and causes missing or misallocated transactions.

Furthermore, users navigating the event calendar require direct contextual actions on event elements to view financial details, edit the event, create associated transactions, or delete the event.

## Decision

We have established the architectural decoupling of event transactions from calendar date constraints and introduced dedicated routing and data service extensions:

1. **Temporal Decoupling of Event Transactions:**
   Transactions linked to an event (`event_id`) belong to that event's financial ledger unconditionally. The association is governed strictly by event identity rather than the transaction date or the event's calendar duration (`start_date` to `end_date`).

2. **Dedicated Event Detail Route (`/event/:eventId`):**
   Register a dedicated route under `DashboardLayout` within the authenticated client routing tree. This page serves as the host financial dashboard for an event, displaying:
   - Header navigation with a "Voltar ao calendário" link (`/event`).
   - Event title, description (if present), formatted date range in Portuguese (BR), and status badge (`Concluído`, `Em andamento`, `Próximo`).
   - Header quick actions: "Nova transação", "Editar", and "Excluir".
   - Four financial KPI summary cards: Receitas (`EARNING`), Despesas (`EXPENSE`), Investimentos (`INVESTMENT`), and Saldo Líquido (`EARNING - EXPENSE - INVESTMENT`).
   - A sortable transactions ledger table with inline editing and deletion actions.

3. **Transaction Data Service and Query Cache Extensions:**
   - Extend `TransactionService.getAll` to accept an optional `eventId` property within its input object, emitting the query parameter `event_id` (`GET /api/transactions/me?event_id=:eventId`).
   - Extend `getTransactionsQueryKey` to isolate cache keys for event transactions: `['getTransactions', userId, { eventId }]` when `eventId` is provided, preserving date-based query keys `['getTransactions', userId, from, to]` otherwise.
   - Extend `useGetTransactions` to accept `{ from, to, eventId }` with an enabled predicate of `Boolean(userId) && (Boolean(eventId) || (Boolean(from) && Boolean(to)))`.
   - Maintain cache consistency across mutations (`useCreateTransaction`, `useEditTransaction`, `useDeleteTransaction`) via query key prefix invalidation on `['getTransactions', userId]`.

4. **Event Single-Resource Fetching:**
   - Extend `EventService.getById` to call `GET /api/events/me/:id` (supporting both string ID and `{ id }` input parameters), normalizing API attributes consistently through `mapEventFromApi` (matching `EventService.getAll`).
   - Implement `useGetEvent({ eventId })` and `getEventQueryKey({ userId, eventId })` cached under `['getEvent', userId, eventId]`, enabled when `Boolean(userId) && Boolean(eventId)`.
   - Export `getEventQueryKey` and `useGetEvent` through the public feature entry point (`src/features/events/index.js`).

5. **Calendar Context Dropdown Menu:**
   Provide a dropdown menu primitive powered by `@base-ui/react/menu` (strictly avoiding `asChild` and using Base UI render composition) across Month, Week, Day, and Sidebar calendar views offering quick actions:
   - "Ver detalhes e transações" (`ReceiptText` icon) -> navigates to `/event/:eventId`.
   - "Editar evento" (`Pencil` icon) -> opens `EditEventSheet`.
   - "Adicionar transação" (`Plus` icon) -> opens transaction dialog with `eventId` pre-populated.
   - "Excluir evento" (`Trash2` icon) -> opens delete confirmation dialog.

## Considered Alternatives

- **Client-Side Filtering of Global Transactions:**
  Fetch all transactions for an expansive date range and filter by `eventId` in memory.
  *Rejected:* Advance payments and post-event expenses often fall far outside any loaded dashboard window. Querying unbounded date intervals increases latency, consumes excessive bandwidth, and fails to guarantee data completeness.

- **Embedding Transactions in Event Payload (`GET /api/events/me/:id`):**
  Include the transaction array directly inside the event endpoint response.
  *Rejected:* Violates Single Responsibility Principle, creates bloated payloads for events with many transactions, duplicates data contracts, and couples transaction cache invalidation to event cache lifecycles.

- **Restricting Transactions to Calendar Date Range:**
  Enforce that transactions linked to an event must have a `date` within `[start_date, end_date]`.
  *Rejected:* Incompatible with real-world financial behavior, where deposits, tickets, and reconciliations frequently occur before or after the calendar dates of the event.

## Consequences

- **Domain Consistency:** Financial tracking aligns with user expectations by capturing all associated transactions regardless of transaction dates.
- **Cache Isolation:** TanStack Query cache key isolation prevents collisions between the main dashboard date-range transactions and event-specific ledgers.
- **Performance & Scalability:** Targeted endpoint queries (`?event_id=:eventId`) minimize network payload size and client processing overhead.
- **Defensive Reliability:** Null-safe query hooks and boolean guards protect against unauthenticated errors and query executions during page transitions.
