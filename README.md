# MyPOS

A fully-featured desktop point-of-sale system built with Electron, React, and TypeScript. Designed for small retail and café businesses — runs entirely offline with a local SQLite database.

---

## Features

**Point of Sale**
- Product grid with search, category filtering, and barcode scanner support
- Cart with hold/resume, quantity adjustments, and order-level discounts
- Optional customer association per sale
- Cash, card, and split payment processing with change calculation
- Receipt view after payment completion

**Sales & Returns**
- Incremental bill numbers (`#0001`, `#0002`, …)
- Full sales history with search, status filter, and payment method filter
- Order detail view with itemised breakdown
- Return processing — select items, quantity, reason, and refund method
- Stock automatically restored on return

**Inventory**
- Product catalogue with SKU, barcode, cost price, sale price, and stock quantity
- Low-stock alerts with configurable threshold
- Stock adjustment log with reason tracking
- Category management

**Customers**
- Customer profiles with contact details
- Loyalty points — earned automatically on completed orders
- Customer search and edit

**Reports**
- Date range selector (single day or multi-day)
- Summary stats: revenue, order count, average order, tax collected, discounts
- Top products by quantity sold and revenue
- Revenue breakdown by category
- Export to CSV: Sales History or Full Report

**Administration**
- Role-based access: Admin and Cashier
- PIN-based login (4–6 digits)
- User management — create, edit, deactivate
- Light and dark theme

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Desktop framework | Electron | 30 |
| Build tooling | electron-vite | 2.1 |
| Monorepo | pnpm workspaces + Turborepo | pnpm 9, Turbo 2.1 |
| Frontend | React + React Router | 18.3, 6.23 |
| Language | TypeScript (strict) | 5.4 |
| State management | Zustand | 4.5 |
| Styling | Tailwind CSS | 3.4 |
| Icons | Lucide React | — |
| Database | SQLite via better-sqlite3 | 9.6 |
| ORM | Drizzle ORM | 0.30 |
| Auth | bcryptjs (PIN hashing) | 2.4 |
| Testing | Jest + ts-jest | 29 |

---

## Architecture

The project is a pnpm monorepo with strict layer separation:

```
UI (renderer) → IPC bridge (preload) → Handlers → Controllers → Services → Repositories → SQLite
```

**Packages**

| Package | Purpose |
|---|---|
| `packages/shared` | Interfaces, enums, constants, and utilities shared across all layers |
| `packages/database` | Drizzle schema, migrations, and repository classes (only layer that touches SQLite) |
| `packages/core` | Stateless business logic — services (tax, payment, returns, reports) and controllers |
| `packages/ipc` | IPC channel names, handler registration, and argument/response types |
| `apps/desktop` | Electron app — main process, preload bridge, and React renderer |

**Rules that are never broken**
- The renderer never imports from `packages/core` or `packages/database` directly — all data flows through IPC.
- Handlers delegate to controllers only — no business logic in handlers.
- Controllers delegate to services only — no direct DB calls.
- Services delegate to repositories only.
- Repositories are the only code that runs Drizzle queries.

---

## Project Structure

```
my_pos/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── main/          # Electron main process (app init, DB bootstrap, IPC setup)
│       │   ├── preload/       # contextBridge — exposes window.api to renderer
│       │   └── renderer/src/
│       │       ├── pages/     # Route-level components
│       │       ├── components/# UI components and modals
│       │       ├── hooks/     # Custom React hooks
│       │       └── store/     # Zustand stores (auth, cart, theme)
│       ├── tailwind.config.cjs
│       └── electron.vite.config.ts
│
└── packages/
    ├── shared/src/
    │   ├── types/             # IProduct, IOrder, IReturn, IUser, …
    │   ├── constants/         # TAX_RATE, LOW_STOCK_THRESHOLD, …
    │   └── utils/             # formatCurrency, Result<T,E>, tax helpers
    ├── database/src/
    │   ├── schema.ts          # Drizzle table definitions
    │   ├── bootstrap.ts       # Runs migrations on startup
    │   ├── migrations/        # 001_initial_schema, 002_returns
    │   └── repositories/      # ProductRepository, OrderRepository, ReturnRepository, …
    ├── core/src/
    │   ├── services/          # CartService, PaymentService, ReturnService, ReportService, …
    │   └── controllers/       # ProductController, OrderController, ReturnController, …
    └── ipc/src/
        ├── channels.ts        # All channel name constants
        ├── handlers.ts        # ipcMain handler registration
        └── types.ts           # IpcResponse<T>, per-channel argument types
```

---

## Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/login` | Login | Public |
| `/pos` | Point of Sale | All |
| `/dashboard` | Dashboard | All |
| `/sales` | Sales History | All |
| `/inventory` | Inventory | All |
| `/customers` | Customers | All |
| `/categories` | Categories | Admin |
| `/reports` | Reports | Admin |
| `/settings` | Settings / Users | Admin |

---

## Database Schema

Ten tables managed by Drizzle ORM with versioned migrations:

`categories` → `products` → `order_items` → `orders` → `payments`  
`customers` ← `orders` → `users`  
`stock_adjustments` (audit log)  
`returns` + `return_items` (linked to orders)

All monetary values are stored as integers in cents to avoid floating-point issues.

---

## Getting Started

**Prerequisites**
- Node.js >= 20
- pnpm >= 9

**Install dependencies**

```bash
pnpm install
```

**Rebuild native modules for Electron**

```bash
cd apps/desktop && pnpm rebuild
```

**Run in development**

```bash
pnpm dev
```

This starts the Electron app with hot-reload for the renderer. Changes to the main process or preload require a full restart.

**Build for production**

```bash
pnpm build
```

**Run tests**

```bash
pnpm test
```

---

## Default Login

On first launch the database is seeded with a default admin account:

| Field | Value |
|---|---|
| Username | `admin` |
| PIN | `1234` |

Change the PIN from the Settings page after first login.

---

## Configuration

The database is stored at `~/.config/app/pos.db` by default. Override with the `DATABASE_PATH` environment variable.

Key constants in `packages/shared/src/constants/index.ts`:

| Constant | Default |
|---|---|
| `TAX_RATE` | 8% |
| `LOW_STOCK_THRESHOLD` | 10 units |
| `LOYALTY_POINTS_PER_DOLLAR` | 1 point |
| `MAX_DISCOUNT_PERCENT` | 50% |

---

## IPC Channels

All communication between the renderer and main process goes through typed IPC channels defined in `packages/ipc/src/channels.ts`. Channel groups: `PRODUCTS`, `ORDERS`, `CUSTOMERS`, `AUTH`, `INVENTORY`, `CATEGORIES`, `REPORTS`, `RETURNS`.

Every channel returns `IpcResponse<T>`:

```typescript
type IpcResponse<T> = { success: true; data: T } | { success: false; error: string };
```

---

## Hardware Integration

**Barcode scanner** — USB HID scanners that emulate keyboard input are supported out of the box. The scanner hook (`useBarcodeScanner`) distinguishes scanner input from manual typing by keystroke timing (< 100 ms between characters = scanner). No drivers or configuration needed.

**Receipt printer** — not yet implemented. The data layer and receipt model are in place (`packages/core/src/models/`); adding ESC/POS printing via a WebUSB or serial port bridge is the intended next step.
