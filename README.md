# Restaurant POS Frontend — Project Skeleton

React + Vite + Tailwind CSS. One app, routes gated by role.

## Folder Structure

```
restaurant-pos-frontend/
├── index.html
├── src/
│   ├── main.jsx                  # entry point
│   ├── App.jsx                    # all routes, wrapped in ProtectedRoute per role
│   ├── index.css                  # Tailwind directives
│   ├── api/
│   │   └── axiosInstance.js       # auto-attaches JWT to every request
│   ├── context/
│   │   └── AuthContext.jsx        # holds { token, user: { role, restaurantId } }
│   ├── components/
│   │   └── ProtectedRoute.jsx     # role check — bounces wrong-role users to their own screen
│   └── pages/
│       ├── auth/
│       │   ├── StaffLogin.jsx     # owner, chef, cashier share this login
│       │   ├── OwnerSignup.jsx    # registers the restaurant + owner account
│       │   ├── CustomerLogin.jsx
│       │   └── CustomerSignup.jsx
│       ├── customer/
│       │   └── MenuPage.jsx       # QR resolve -> menu -> cart -> order -> get bill
│       ├── kitchen/
│       │   └── KitchenDisplay.jsx # live orders via Socket.IO + voice announcements
│       ├── cashier/
│       │   └── CashierDashboard.jsx # live bill alerts + mark-as-paid
│       └── owner/
│           └── OwnerDashboard.jsx # tabs: Menu, Tables/QR, Reports
```

## How Roles Map to Screens

| Role | Route | Login page |
|---|---|---|
| Customer | `/menu` | `/login` or `/signup` (reached via `/order?table=<qrToken>`) |
| Chef | `/kitchen` | `/staff-login` (account created by the owner — see below) |
| Cashier | `/cashier` | `/staff-login` (account created by the owner — see below) |
| Owner | `/owner` | `/staff-login` (account created via `/owner-signup`) |

## Account Creation Flow

- **Owner**: registers the restaurant itself at `/owner-signup` — this calls
  `POST /auth/owner/register`, which creates both the `Restaurant` and the
  first `Staff` record (role: owner) in one step
- **Chef / Cashier**: NOT self-registered. The owner creates these from the
  "Staff" tab on `/owner` (calls `POST /staff`), then shares the phone number
  and password with that staff member, who logs in at `/staff-login`

`ProtectedRoute` reads the role out of `AuthContext` (which mirrors the JWT payload
from the backend). If someone lands on a route their role doesn't match — e.g. a
cashier hitting `/kitchen` directly — they're redirected to their own home screen,
never shown the other role's data.

## Customer Flow (QR to Order)

1. Table's printed QR code points to `<frontend-url>/order?table=<qrToken>`
2. That route renders `CustomerLogin`, which carries the `table` param through
   login/signup
3. On success, redirected to `/menu?table=<qrToken>`
4. `MenuPage` resolves the token via `GET /tables/token/:qrToken`, loads the
   restaurant's menu, and lets the customer start/join a session, add items,
   place orders, and request the bill

## Real-Time (Socket.IO)

Both `KitchenDisplay` and `CashierDashboard` connect to the backend's Socket.IO
server and immediately call:
```js
socket.emit("join_room", { restaurantId, screen: "kitchen" | "cashier" })
```
This joins a room scoped to that one restaurant, so events never cross
between tenants. `KitchenDisplay` also reads new orders aloud using the
browser's built-in Web Speech API (`SpeechSynthesisUtterance`) — no
external service needed.

## Still To Build / Polish

- Session join UI (letting a second group at the same table join an existing
  session, using `GET /sessions/table/:tableId`)
- Nicer cart/quantity editing on `MenuPage` (currently one-tap-adds-one-item)
- Real notification sound file for the cashier alert (currently a placeholder beep)
- Loading and error states are minimal — fine for now, worth polishing before
  handing this to an actual restaurant

## Running Locally

```bash
npm install
cp .env.example .env   # point VITE_API_URL / VITE_SOCKET_URL at your backend
npm run dev
```
