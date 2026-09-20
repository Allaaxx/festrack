# Finance App API Documentation

**Version:** 1.0.0
**Description:** API for FSC Finance App that allows users to manage their finances.

---

## Authentication

The API uses **Bearer Token** authentication. 
Pass the token in the `Authorization` header:
`Authorization: Bearer <your_token>`

---

## Endpoints

### 1. Auth

#### `POST /api/auth`
Create a new user.
* **Body:** `CreateUserParams` (first_name, last_name, email, password)
* **Returns:** `201 Created` with `UserWithToken`

#### `POST /api/auth/login`
Login user.
* **Body:** `LoginUserParams` (email, password)
* **Returns:** `200 OK` with `UserWithToken`

#### `POST /api/auth/refresh-token`
Refresh user token.
* **Body:** `RefreshTokenParams` (refresh_token)
* **Returns:** `200 OK` with `Tokens` (accessToken, refreshToken)

#### `GET /api/auth` (Requires Auth)
Get authenticated user. (Alternative to `/api/users/me`)
* **Returns:** `200 OK` with `User`

#### `PATCH /api/auth` (Requires Auth)
Update authenticated user. (Alternative to `/api/users/me`)
* **Body:** `CreateUserParams`
* **Returns:** `200 OK` with `User`

#### `DELETE /api/auth` (Requires Auth)
Delete authenticated user. (Alternative to `/api/users/me`)
* **Returns:** `200 OK` with deleted `User`

---

### 2. User

#### `GET /api/users/me` (Requires Auth)
Get authenticated user.
* **Returns:** `200 OK` with `User`

#### `PATCH /api/users/me` (Requires Auth)
Update authenticated user.
* **Body:** `CreateUserParams`
* **Returns:** `200 OK` with `User`

#### `DELETE /api/users/me` (Requires Auth)
Delete authenticated user.
* **Returns:** `200 OK` with deleted `User`

#### `GET /api/users/me/balance` (Requires Auth)
Get authenticated user balance.
* **Query Params:**
  * `from` (required, string YYYY-MM-DD): Start date
  * `to` (required, string YYYY-MM-DD): End date
* **Returns:** `200 OK` with `UserBalance`

---

### 3. Transactions (Requires Auth)

#### `POST /api/transactions/me`
Create a new transaction.
* **Body:** `CreateTransactionParams` (name, type, amount, date, optional event_id)
* **Returns:** `200 OK` with `Transaction`

#### `GET /api/transactions/me`
Get user transactions.
* **Query Params:**
  * `from` (required, string YYYY-MM-DD)
  * `to` (required, string YYYY-MM-DD)
* **Returns:** `200 OK` with array of `Transaction`

#### `PATCH /api/transactions/me/{transactionId}`
Update transaction.
* **Path Params:** `transactionId`
* **Body:** `UpdateTransactionParams`
* **Returns:** `200 OK` with updated `Transaction`

#### `DELETE /api/transactions/me/{transactionId}`
Delete transaction.
* **Path Params:** `transactionId`
* **Returns:** `200 OK` with deleted `Transaction`

---

### 4. Events (Requires Auth)

#### `POST /api/events/me`
Create a new event.
* **Body:** `CreateEventParams` (name, description, start_date, end_date)
* **Returns:** `201 Created` with `Event`

#### `GET /api/events/me`
Get all user events.
* **Returns:** `200 OK` with array of `Event`

#### `GET /api/events/me/{eventId}`
Get specific event.
* **Path Params:** `eventId` (UUID)
* **Returns:** `200 OK` with `Event`

#### `PATCH /api/events/me/{eventId}`
Update specific event.
* **Path Params:** `eventId` (UUID)
* **Body:** `UpdateEventParams`
* **Returns:** `200 OK` with updated `Event`

#### `DELETE /api/events/me/{eventId}`
Delete specific event.
* **Path Params:** `eventId` (UUID)
* **Returns:** `200 OK` with deleted `Event`

---

## Models (Definitions)

### `User`
* `id` (string)
* `first_name` (string)
* `last_name` (string)
* `email` (string, format: email)
* `password` (string, format: password)

### `UserBalance`
* `earnings` (number)
* `expenses` (number)
* `investiments` (number)
* `earningsPercentage` (number)
* `expensePercentage` (number)
* `investmentsPercentage` (number)
* `balance` (number)

### `Transaction`
* `id` (string)
* `user_id` (string)
* `name` (string)
* `type` (string: "EARNING" | "EXPENSE" | "INVESTIMENT")
* `amount` (number)
* `event_id` (string, uuid, optional)

### `Event`
* `id` (string, uuid)
* `user_id` (string, uuid)
* `name` (string)
* `description` (string, nullable)
* `start_date` (string, date-time, e.g. "2026-12-01T09:00:00.000Z")
* `end_date` (string, date-time, e.g. "2026-12-01T18:30:00.000Z")

### `Tokens` / `UserWithToken`
Includes `accessToken` and `refreshToken` (JWT strings).
