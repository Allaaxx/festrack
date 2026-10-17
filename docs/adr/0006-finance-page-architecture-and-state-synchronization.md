# ADR 0006: Finance Page Architecture and State Synchronization

## Status

Accepted (Builds upon ADR 0005)

## Context

Following the establishment of the `/finances` route and the `finances` feature domain in ADR 0005, the primary financial cockpit page (`src/pages/finance.jsx`) required a robust architectural foundation to transition from static mockup components to live, reactive user data:

1. **Logic and Presentation Separation:** Following the established architectural pattern in `src/features/events` (where `EventPage` delegates state to `useEventCalendarPage`), the finances page should remain a declarative shell, orchestrating data and interactions through a dedicated domain page hook (`useFinancePage`).
2. **State Persistence & URL Synchronization:** Filter parameters (date interval `from`/`to`, search query `q`, active table page `page`, and rows per page `pageSize`) must synchronize bidirectionally between URL query parameters and user-scoped `localStorage`. When a user visits without saved preferences, the reporting window must automatically initialize to the active current month (`startOfMonth` to `endOfMonth`).
3. **Cockpit Metrics & Daily Cash Flow Aggregation:** High-level balance cards (`SectionCards`) and the interactive area chart (`ChartAreaInteractive`) must dynamically calculate live metrics from `useGetUserBalance` and `useGetTransactions`. The chart requires continuous daily aggregation comparing Entradas (`EARNING`) versus Saídas (`EXPENSE` and `INVESTMENT`), filling days with no transactions with R$ 0,00 to ensure an unbroken chronological curve.
4. **Table Actions & Pagination Integrity:** In `TransactionsTable`, action trigger popups (Edit Sheet and Delete Dialog) experienced event collisions with the row-click detail drawer and premature dismissal when nested directly within dropdown menu items. In addition, table pagination required strict TanStack Table v9 row-model pipeline sequencing (`filteredRowModel` -> `sortedRowModel` -> `paginatedRowModel`) to slice records accurately and bind to URL navigation.

## Decision

1. **Domain Controller Hook (`useFinancePage`):**
   - Implemented in `src/features/finances/hooks/use-finance-page.js` and exported through the public feature API (`src/features/finances/index.js`).
   - Uses `useStoredSearchParams` under key `LOCAL_STORAGE_FINANCE_FILTERS_KEY` (`festrack:<userId>:finance_filters`).
   - Automatically initializes default dates to `startOfMonth(new Date())` and `endOfMonth(new Date())` (formatted as `YYYY-MM-DD`).
   - Manages unified query lifecycles (`useGetUserBalance`, `useGetTransactions`), loading/error states, and refetch handlers.

2. **Metrics & Chart Presentation:**
   - `SectionCards` binds to `UserBalance` (`earnings`, `expenses`, `investiments`, and `balance`), displaying formatted BRL currency and directional percentage indicators (`TrendingUpIcon` / `TrendingDownIcon`).
   - `ChartAreaInteractive` uses a pure aggregation helper (`buildDailyChartData`) to map transactions across every calendar day of the interval, zero-filling gaps and comparing `entradas` against `saidas` with Festrack semantic gradient tokens (`--color-primary-green` and `--color-primary-red`).
   - Preset buttons (`7d`, `30d`, `90d`) and custom date selection update the shared date interval.

3. **Isolated Action Menus & Controlled Pagination:**
   - Encapsulate row actions into `TransactionActionsCell` where `EditTransactionButton` and `DeleteTransactionButton` modal sheets/dialogs mount outside the `DropdownMenu` boundary, stopping click propagation (`e.stopPropagation()`) to prevent triggering the row-click detail drawer.
   - Enforce TanStack Table v9 pipeline ordering (`filteredRowModel` -> `sortedRowModel` -> `paginatedRowModel`) so that `table.getRowModel().rows` delivers accurately sliced page rows, fully wired to controlled URL pagination.

## Consequences

- The finances page aligns strictly with the single responsibility principle and Festrack's Feature-First vertical slice architecture.
- Users experience persistent, shareable, and bookmarkable filter states across sessions and route navigation.
- Action menus and detail drawers operate without event collisions or premature modal dismissals.
- End-to-end integration testing is anchored at the highest practical seam (`src/pages/finance.test.jsx`).
