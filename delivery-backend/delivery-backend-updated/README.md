# Delivery Management System — Backend (MVP)

Node.js + Express + MongoDB + JWT backend for the Delivery Management System.

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set MONGO_URI and a strong JWT_SECRET
npm run dev   # or: npm start
```

Requires a running MongoDB instance (local or Atlas) reachable at `MONGO_URI`.

## Auth

All `/api/orders/*` routes require a JWT in the header:
```
Authorization: Bearer <token>
```
Get a token from `POST /api/auth/register` or `POST /api/auth/login`.

## Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create user (`name`, `phone`, `password`, optional `role`) |
| POST | `/api/auth/login` | public | Login with `phone`, `password` |
| POST | `/api/orders` | customer | Create order (`pickupAddress`, `deliveryAddress`) |
| GET | `/api/orders/:id` | owner/assigned driver/admin | Get one order |
| GET | `/api/orders/customer/:customerId` | customer (self) / admin | List a customer's orders |
| GET | `/api/orders/driver/:driverId` | driver (self) / admin | List a driver's assigned orders |
| GET | `/api/orders` | admin | List all orders |
| PUT | `/api/orders/:id/assign` | admin | Assign driver (`driverId` in body) — sets `assignedAt` |
| PUT | `/api/orders/:id/pickup` | assigned driver | `assigned` → `picked_up`, sets `pickedUpAt` |
| PUT | `/api/orders/:id/out-for-delivery` | assigned driver | `picked_up` → `out_for_delivery` |
| PUT | `/api/orders/:id/deliver` | assigned driver | → `delivered`, sets `deliveredAt` |

> Note: the spec's status flow includes `out_for_delivery` between `picked_up` and `delivered`, but only listed `pickup`/`deliver` endpoints. I added `PUT /api/orders/:id/out-for-delivery` so the flow is fully reachable. If you'd rather have "Delivered" collapse `picked_up` straight to `delivered` (skipping the extra tap), the driver app can just not show that button — the deliver endpoint accepts either prior state.

## Status flow enforcement

Each status-changing endpoint checks the order's **current** status server-side before transitioning, so an order can't jump straight from `created` to `delivered` etc., and returns `409 Conflict` if the transition is invalid.

## Address format

`pickupAddress` / `deliveryAddress` are objects, ready for Google Maps:
```json
{ "label": "Al Barsha, Dubai", "lat": 25.1122, "lng": 55.2007 }
```

## Role-based access

- **customer**: create orders, view own orders
- **driver**: view own assigned orders, update pickup/out-for-delivery/delivered
- **admin**: view all orders, assign drivers

Enforced via `middleware/auth.js` (`protect` verifies JWT, `authorize(...roles)` checks role) plus ownership checks inside controllers (e.g. a driver can't update an order that isn't assigned to them).

## Real-time (not included yet)

Skipped for this MVP pass per your earlier choice. To add later: emit a Socket.IO event (e.g. `order:statusUpdated`) at the end of `markPickedUp`, `markOutForDelivery`, `markDelivered`, and `assignDriver` in `controllers/orderController.js` — the status-mutation logic is already isolated there, so it's a small addition, not a refactor.

## Next steps

- Flutter customer/driver/admin apps consuming this API
- Google Maps integration on the frontend for address picking + live tracking
- Optional: Socket.IO for live status push
