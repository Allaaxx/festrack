# Finance App API Documentation

**Version:** 2.0.0
**Description:** API for FSC Finance App that allows users to manage their finances, transactions, and events.

---

## Authentication & Transport

The API uses **Better Auth** with dual transport support:

1. **HTTP-only Cookies (Recommended for Web):**
   - Configured automatically upon sign-in/sign-up via `Set-Cookie: better-auth.session_token=<token>.<signature>; HttpOnly; SameSite=Lax; Path=/`.
   - For Axios or fetch clients, pass `withCredentials: true`/`credentials: "include"`.
2. **Bearer Token (Alternative / Mobile / CLI):**
   - Pass the session token in the `Authorization` header:
     `Authorization: Bearer <session_token>`

Unauthenticated requests to protected endpoints return `401 Unauthorized` with `{ "message": "Unauthorized" }`.

---

## Endpoints

### 1. Auth (`/api/auth/*`)

Managed by Better Auth.

#### `POST /api/auth/sign-up/email`

Register a new user account.

- **Body:**
  - `email` (string, required, valid email)
  - `password` (string, required, min 6 characters)
  - `name` (string, required, full name)
  - `first_name` (string, required)
  - `last_name` (string, required)
- **Returns:** `200 OK` with `{ token: string, user: User }` and sets HTTP-only session cookie.

#### `POST /api/auth/sign-in/email`

Authenticate existing user.

- **Body:**
  - `email` (string, required)
  - `password` (string, required)
- **Returns:** `200 OK` with `{ token: string, user: User }` and sets HTTP-only session cookie.

#### `GET /api/auth/get-session`

Inspect active session and authenticated user profile.

- **Headers:** Cookie or `Authorization: Bearer <session_token>`
- **Returns:** `200 OK` with `{ session: Session, user: User }` if authenticated, or `null` if no active session.

#### `POST /api/auth/sign-out`

Terminate the active session and revoke credentials.

- **Headers:** Cookie or `Authorization: Bearer <session_token>`
- **Body:** `{}`
- **Returns:** `200 OK` with `{ success: true }` and clears session cookie.

---

### 2. User (`/api/users/*`)

All user endpoints require authentication.

#### `GET /api/users/me` (Requires Auth)

Get authenticated user profile from domain repository.

- **Returns:** `200 OK` with `User`

#### `PATCH /api/users/me` (Requires Auth)

Update profile fields of the authenticated user.

- **Body:** `UpdateUserParams`
  - `first_name` (string, optional)
  - `last_name` (string, optional)
  - `email` (string, optional, valid email)
- **Returns:** `200 OK` with updated `User`

#### `DELETE /api/users/me` (Requires Auth)

Delete authenticated user and cascade-delete all associated events, transactions, and sessions.

- **Returns:** `200 OK` with deleted `User`

#### `GET /api/users/me/balance` (Requires Auth)

Calculate financial balance and categorical breakdown for a date range.

- **Query Params:**
  - `from` (required, string `YYYY-MM-DD`): Start date
  - `to` (required, string `YYYY-MM-DD`): End date
- **Returns:** `200 OK` with `UserBalance`

---

### 3. Transactions (`/api/transactions/*`)

All transaction endpoints require authentication.

#### `POST /api/transactions/me` (Requires Auth)

Create a new transaction for the authenticated user.

- **Body:**
  - `name` (string, required)
  - `type` (string: `"EARNING"` | `"EXPENSE"` | `"INVESTIMENT"`, required)
  - `amount` (number, required, positive numeric amount)
  - `date` (string `YYYY-MM-DD`, required)
  - `event_id` (string UUID, optional, nullable)
- **Returns:** `201 Created` with `Transaction`

#### `GET /api/transactions/me` (Requires Auth)

Get all transactions belonging to the authenticated user within a date range.

- **Query Params:**
  - `from` (required, string `YYYY-MM-DD`)
  - `to` (required, string `YYYY-MM-DD`)
- **Returns:** `200 OK` with `Transaction[]`

#### `PATCH /api/transactions/me/{transactionId}` (Requires Auth)

Update a transaction belonging to the authenticated user.

- **Path Params:** `transactionId` (string, UUID)
- **Body:**
  - `name` (string, optional)
  - `type` (string: `"EARNING"` | `"EXPENSE"` | `"INVESTIMENT"`, optional)
  - `amount` (number, optional)
  - `date` (string `YYYY-MM-DD`, optional)
  - `event_id` (string UUID, optional, nullable)
- **Returns:** `200 OK` with updated `Transaction`

#### `DELETE /api/transactions/me/{transactionId}` (Requires Auth)

Delete a transaction belonging to the authenticated user.

- **Path Params:** `transactionId` (string, UUID)
- **Returns:** `200 OK` with deleted `Transaction`

---

### 4. Events (`/api/events/*`)

All event endpoints require authentication.

#### `POST /api/events/me` (Requires Auth)

Create a new event.

- **Body:**
  - `name` (string, required)
  - `description` (string, optional)
  - `start_date` (string ISO date-time, e.g. `"2026-12-01T09:00:00.000Z"`, required)
  - `end_date` (string ISO date-time, e.g. `"2026-12-01T18:00:00.000Z"`, required)
- **Returns:** `201 Created` with `Event`

#### `GET /api/events/me` (Requires Auth)

Get all events belonging to the authenticated user.

- **Returns:** `200 OK` with `Event[]`

#### `GET /api/events/me/{eventId}` (Requires Auth)

Get a specific event belonging to the authenticated user.

- **Path Params:** `eventId` (string, UUID)
- **Returns:** `200 OK` with `Event`

#### `PATCH /api/events/me/{eventId}` (Requires Auth)

Update an existing event.

- **Path Params:** `eventId` (string, UUID)
- **Body:**
  - `name` (string, optional)
  - `description` (string, optional)
  - `start_date` (string ISO date-time, optional)
  - `end_date` (string ISO date-time, optional)
- **Returns:** `200 OK` with updated `Event`

#### `DELETE /api/events/me/{eventId}` (Requires Auth)

Delete an event (disassociates any linked transactions, setting their `event_id` to `null`).

- **Path Params:** `eventId` (string, UUID)
- **Returns:** `200 OK` with deleted `Event`

---

## Models (Definitions)

### `User`

```typescript
interface User {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
}
```

_(Note: Passwords are encrypted and held in Better Auth infrastructure tables and are never exposed)._

### `Session`

```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string; // ISO date-time
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
}
```

### `UserBalance`

```typescript
interface UserBalance {
  earnings: number;
  expenses: number;
  investiments: number;
  earningsPercentage: number;
  expensePercentage: number;
  investmentsPercentage: number;
  balance: number;
}
```

### `Transaction`

```typescript
interface Transaction {
  id: string;
  user_id: string;
  name: string;
  type: 'EARNING' | 'EXPENSE' | 'INVESTIMENT';
  amount: number;
  date: string; // YYYY-MM-DD
  event_id?: string | null;
}
```

### `Event`

```typescript
interface Event {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  start_date: string; // ISO date-time
  end_date: string; // ISO date-time
}
```
