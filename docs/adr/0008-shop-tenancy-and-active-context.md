# Shop Tenancy and Global Active Shop Context

We decided to model multi-tenant shop scoping using a global `ShopContext` persisted in `localStorage` with flat routes (`/finances`, `/events`, `/settings`), rather than nesting routes under a URL slug (e.g. `/:shopId/finances`).

## Context

The backend introduced multi-tenant `Shop` boundaries, scoping all events, transactions, and balances to `:shopId`. On the client, users can belong to multiple shops and switch between them via the sidebar's `ShopSwitcher`.

## Considered Options

1. **Path-Scoped Routing (`/:shopId/finances`, `/:shopId/events`):**
   - *Pros:* Deep-linking per shop, native multi-tab support with different active shops.
   - *Cons:* Heavy refactoring of existing routes and navigation links; requires wrapping all authenticated routes under a `:shopId` dynamic parameter; complicates bookmarks and auth redirects.

2. **Global Active Shop Context (`ShopContext` + `localStorage`):**
   - *Pros:* Keeps application URLs clean and uniform; zero disruption to existing page routing (`/finances`, `/events`); centralized invalidation of TanStack Query caches upon switching; seamless integration with `ShopSwitcher`.
   - *Cons:* Multiple tabs share the same active shop from `localStorage`.

## Consequences

- All domain API queries (`features/events`, `features/finances`) read `activeShop.id` from `useShopContext()`.
- If an authenticated user has zero shops, an onboarding modal forces shop creation before accessing features.
- Switching shops in `ShopSwitcher` updates state, persists the active ID in storage, and triggers a query invalidation across all shop-scoped data.
