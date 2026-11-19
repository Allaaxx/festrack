# 0009. Civil-Date Carrier for All-Day Events via Explicit `all_day` Boolean

Status: Accepted

We represent All-Day Events using the explicit `allDay` (`all_day`) flag from the API rather than inferring `00:00`–`23:59` from timestamps: when `allDay = true`, `start_date` and `end_date` are serialized and parsed strictly by their UTC civil calendar date (`YYYY-MM-DDT00:00:00.000Z` to `YYYY-MM-DDT23:59:59.000Z`, inclusive), whereas when `allDay = false`, timestamps are serialized with the user's explicit local offset and parsed back as timezone-aware instants in the viewer's local timezone.

## Context

After switching event API payloads to include explicit local timezone offsets (`-03:00`), Postgres persisted all-day boundaries in UTC (`03:00Z` to `02:59Z` of the next day). Because `parseEventDate` stripped the trailing `Z`, all-day events lost their `00:00`–`23:59` signature and spilled onto the following day, while late-night timed events also shifted by +3 hours.

## Considered Options

1. **Keep inferring `allDay` from local `00:00`–`23:59`:** Rejected because civil all-day events must not shift dates when viewed across timezones and must not collide with timed `00:00`–`23:59` schedules.
2. **Use separate date-only fields on the frontend API:** Rejected to stay aligned with the backend's unified `start_date`/`end_date` + `all_day` contract.
3. **Explicit `all_day` discriminator with mode-specific parsing/formatting:** Selected.

## Consequences

- `EventService.mapEventFromApi` trusts `event.all_day` directly without time-based heuristics.
- `formatEventDateToApi` emits `YYYY-MM-DDT00:00:00.000Z` / `T23:59:59.000Z` for `allDay = true` and `YYYY-MM-DDTHH:mm:ssXXX` for `allDay = false`.
- `parseEventDate` branches on `allDay` (or date-only strings): pure civil date for `allDay = true`, and timezone-aware conversion to local time for `allDay = false`.
