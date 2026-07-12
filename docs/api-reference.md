# API Reference

Base URL: `http://localhost:3001/api/v1`

All protected routes require:
```
Authorization: Bearer <token>
```

Validation errors return `422` with an `errors` array. Business-logic conflicts return `409`.

---

## Authentication

### POST `/auth/signup`
Create a new account. Role is always set to **Employee**.

**Body**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "min8chars"
}
```

**Response `201`**
```json
{ "token": "eyJ...", "user": { "id": "...", "name": "Jane Smith", "role": "Employee" } }
```

---

### POST `/auth/login`

**Body**
```json
{ "email": "jane@company.com", "password": "min8chars" }
```

**Response `200`**
```json
{ "token": "eyJ...", "user": { ... } }
```

---

### GET `/auth/me` 🔒
Returns the authenticated user object.

---

### PATCH `/auth/me/password` 🔒

**Body**
```json
{ "currentPassword": "old", "newPassword": "newmin8" }
```

---

## Users

### GET `/users` 🔒
Query params: `role`, `department_id`, `status`

### GET `/users/:id` 🔒

### PATCH `/users/:id/role` 🔒 Admin only
```json
{ "role": "Asset Manager" }
```
Valid roles: `Employee`, `Department Head`, `Asset Manager`

### PATCH `/users/:id/status` 🔒 Admin only
```json
{ "status": "Inactive" }
```

---

## Departments

### GET `/departments` 🔒
Returns all departments with parent name and head name joined.

### GET `/departments/:id` 🔒

### POST `/departments` 🔒 Admin only
```json
{
  "name": "Engineering",
  "parent_id": null,
  "head_id": "<user-uuid>",
  "status": "Active"
}
```

### PATCH `/departments/:id` 🔒 Admin only
Any subset of the fields above.

---

## Asset Categories

### GET `/categories` 🔒
### GET `/categories/:id` 🔒

### POST `/categories` 🔒 Admin only
```json
{
  "name": "Electronics",
  "custom_fields": [
    { "label": "Warranty Period", "type": "text" },
    { "label": "Expiry Date", "type": "date" }
  ]
}
```

### PATCH `/categories/:id` 🔒 Admin only

---

## Assets

### GET `/assets` 🔒
Query params: `status`, `category_id`, `department_id`, `is_bookable`, `q` (name/tag/serial search)

### GET `/assets/:id` 🔒

### GET `/assets/:id/history` 🔒
Returns `{ allocations: [...], maintenance: [...] }` for the asset.

### POST `/assets` 🔒 Admin | Asset Manager
```json
{
  "name": "MacBook Pro 16\"",
  "category_id": "<uuid>",
  "serial_number": "C02XG0JF",
  "acquisition_date": "2024-01-15",
  "acquisition_cost": 2499,
  "condition": "Good",
  "location": "Engineering Lab",
  "is_bookable": false,
  "custom_fields": { "Warranty Period": "3 years" }
}
```
Tag (e.g. `AF-0011`) is auto-generated.

### PATCH `/assets/:id` 🔒 Admin | Asset Manager
Any subset of the fields above, plus `status` and `photo_url`.

**Asset lifecycle statuses:** `Available` · `Allocated` · `Reserved` · `Under Maintenance` · `Lost` · `Retired` · `Disposed`

---

## Allocations

### GET `/allocations` 🔒
Query params: `active` (`true`/`false`), `asset_id`, `user_id`, `overdue` (`true`)

### POST `/allocations` 🔒 Admin | Asset Manager
Allocates an available asset. Returns `409` with `holder` name if the asset is already allocated.

```json
{
  "asset_id": "<uuid>",
  "assigned_to": "<user-uuid>",
  "department_id": "<dept-uuid>",
  "expected_return_date": "2025-01-01",
  "notes": "Primary work laptop"
}
```

### POST `/allocations/:id/return` 🔒 Admin | Asset Manager | Department Head
Marks the allocation as returned. Asset status reverts to `Available`.

```json
{
  "condition_on_return": "Good — minor scratches",
  "notes": "Returned early"
}
```

---

## Transfers

### GET `/transfers` 🔒
Query params: `status`, `asset_id`

### POST `/transfers` 🔒 Any authenticated user
Raises a transfer request for an allocated asset.

```json
{
  "asset_id": "<uuid>",
  "to_user_id": "<user-uuid>",
  "reason": "New project requirement"
}
```

### PATCH `/transfers/:id/resolve` 🔒 Admin | Asset Manager | Department Head
```json
{ "approved": true }
```
On approval, `assets.assigned_to` is updated to the `to_user_id`.

**Transfer statuses:** `Requested` → `Approved` / `Rejected`

---

## Maintenance

### GET `/maintenance` 🔒
Query params: `status`, `asset_id`, `priority`

### GET `/maintenance/:id` 🔒

### POST `/maintenance` 🔒 Any authenticated user
```json
{
  "asset_id": "<uuid>",
  "issue": "Screen flickering",
  "priority": "Medium",
  "photo_url": null
}
```

### PATCH `/maintenance/:id/status` 🔒 Admin | Asset Manager
```json
{
  "status": "Approved",
  "assigned_technician": "<user-uuid>",
  "notes": "Booked for Thursday"
}
```

**Allowed transitions:**

| From | To |
|------|----|
| Pending | Approved, Rejected |
| Approved | Technician Assigned |
| Technician Assigned | In Progress |
| In Progress | Resolved |

Side effects:
- `Approved` → asset flips to `Under Maintenance`
- `Resolved` → asset flips back to `Available`

---

## Bookings

### GET `/bookings` 🔒
Query params: `asset_id`, `status`, `user_id`, `from` (ISO datetime), `to` (ISO datetime)

### GET `/bookings/:id` 🔒

### POST `/bookings` 🔒 Any authenticated user
The asset must have `is_bookable = true`. Overlapping time slots are rejected at the database level (`EXCLUDE` constraint).

```json
{
  "asset_id": "<uuid>",
  "title": "Sprint Planning",
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T10:00:00Z",
  "notes": ""
}
```

Overlap rule: a new slot `[s, e)` is rejected if any non-cancelled booking for the same asset satisfies `s < existing_end AND e > existing_start`.

### PATCH `/bookings/:id` 🔒 Owner | Admin | Asset Manager
```json
{ "status": "Cancelled" }
```

**Booking statuses:** `Upcoming` · `Ongoing` · `Completed` · `Cancelled`

---

## Audit

### GET `/audit` 🔒
Query params: `status`. Returns cycles enriched with auditor list and item counts.

### GET `/audit/:id` 🔒
Returns full cycle with `auditors` array and `items` array (each item includes asset tag and name).

### POST `/audit` 🔒 Admin | Asset Manager
```json
{
  "name": "Q3 Full Inventory",
  "department_id": "<uuid-or-null>",
  "location": "All Locations",
  "start_date": "2025-07-01",
  "end_date": "2025-07-31",
  "auditor_ids": ["<user-uuid>", "<user-uuid>"]
}
```

### PATCH `/audit/:cycle_id/items/:asset_id` 🔒 Assigned auditors | Admin | Asset Manager
```json
{ "status": "Verified", "notes": "" }
```
Valid item statuses: `Pending` · `Verified` · `Missing` · `Damaged`

### POST `/audit/:id/close` 🔒 Admin | Asset Manager
Locks the cycle. All items with status `Missing` automatically have their asset status updated to `Lost`.

---

## Reports

All report endpoints require **Admin** or **Asset Manager** role.

### GET `/reports/summary` 🔒
Returns counts grouped by asset status, maintenance status, booking status, and overdue allocations.

### GET `/reports/utilization` 🔒
Returns allocated assets by department, by category, most-used assets, and idle assets.

### GET `/reports/maintenance-frequency` 🔒
Assets ranked by total maintenance request count.

### GET `/reports/overdue` 🔒
All active allocations past their `expected_return_date` with days overdue.

### GET `/reports/logs` 🔒
Paginated activity log.
Query params: `type`, `user_id`, `limit` (default 50), `offset` (default 0)

---

## Notifications

### GET `/notifications` 🔒
Returns the current user's notifications.
Query params: `is_read` (`true`/`false`), `type`

### PATCH `/notifications/:id/read` 🔒
Marks a single notification as read.

### PATCH `/notifications/read-all` 🔒
Marks all of the current user's unread notifications as read.

---

## Error format

All errors follow:
```json
{ "error": "Human-readable message" }
```

Validation failures:
```json
{
  "errors": [
    { "field": "email", "msg": "Valid email required" }
  ]
}
```

## Common HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (invalid input) |
| 401 | Missing or invalid token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (double-allocation, booking overlap, duplicate email) |
| 422 | Validation failed |
| 500 | Internal server error |
