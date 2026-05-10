You are helping me build a production-grade, well-structured Point of Sale (POS) desktop application. 

## Stack
- Monorepo with pnpm workspaces + Turborepo
- Electron (main process) + React + TypeScript (renderer)
- Drizzle ORM + better-sqlite3 (local SQLite database)
- Zustand (UI state management)
- Zod (validation)
- Vite (bundler for renderer)
- Tailwind CSS
- Jest + React Testing Library

## Architecture — strictly MVC with clear layer separation

### Package structure (monorepo)
- apps/desktop        → Electron shell (main.ts, preload.ts) + React renderer
- packages/core       → Controllers, Services, Models (pure business logic, no DB/UI)
- packages/database   → Drizzle schema, repositories, migrations, seeds
- packages/shared     → TypeScript interfaces, constants, utility functions
- packages/hardware   → Printer, barcode scanner, cash drawer services
- packages/ipc        → IPC channel names + main-process IPC handlers

### Layer rules (enforce strictly, never break these)
1. UI (React) → calls IPC only. Never imports from database or core directly.
2. IPC handlers → call Controllers only. One handler per channel.
3. Controllers → orchestrate Services. No DB calls directly. No UI imports.
4. Services → contain business logic. Call Repositories for data. Stateless.
5. Repositories → only place that touches Drizzle/SQLite. Returns domain models.
6. Models → plain TypeScript classes/interfaces. No logic, no DB, no UI.
7. Shared → imported by any package. Contains only types, constants, pure utils.

## Code quality rules
- Every file has a single responsibility
- No any types — all fully typed with TypeScript strict mode
- All async functions use async/await, never raw callbacks
- All errors handled with a Result<T, E> pattern or typed error classes
- Every public method has a JSDoc comment
- No magic numbers — all constants in packages/shared/src/constants
- No barrel-file re-exports that create circular deps
- Repository pattern: one repository class per database table

## What to build first (Phase 1 scaffold)

### Step 1 — Project setup
Initialize the monorepo:
- pnpm-workspace.yaml listing all packages
- Root package.json with scripts: dev, build, test, lint
- turbo.json with pipeline: build → test → lint
- tsconfig.base.json with strict: true, paths for all packages
- .eslintrc.js with @typescript-eslint/recommended + import/no-cycle rule
- .prettierrc

### Step 2 — packages/shared
Create these first since everything depends on them:
- types/product.ts      → IProduct, IProductCategory, CreateProductDTO, UpdateProductDTO
- types/order.ts        → IOrder, IOrderItem, OrderStatus enum
- types/customer.ts     → ICustomer, CreateCustomerDTO
- types/user.ts         → IUser, UserRole enum (ADMIN | CASHIER)
- types/payment.ts      → IPayment, PaymentMethod enum (CASH | CARD | SPLIT)
- constants/index.ts    → TAX_RATE, LOW_STOCK_THRESHOLD, APP_NAME, ROLES
- utils/currency.ts     → formatCurrency(cents: number): string
- utils/tax.ts          → calculateTax(subtotal: number): number
- utils/result.ts       → Result<T, E> type + ok() + err() helpers

### Step 3 — packages/database
- schema.ts using Drizzle ORM: products, categories, orders, order_items, customers, users, payments tables
- db.ts: singleton SQLite connection using better-sqlite3
- repositories/ProductRepository.ts: findAll, findById, findByBarcode, create, update, delete, updateStock
- repositories/OrderRepository.ts: findAll, findById, create, updateStatus, getByDateRange
- repositories/CustomerRepository.ts: findAll, findById, findByEmail, create, update
- repositories/UserRepository.ts: findById, findByPin, create, update
- migrations/: numbered migration files (001_initial_schema.ts, etc.)
- seeds/dev.seed.ts: 20 sample products, 2 users (admin + cashier), 5 customers

### Step 4 — packages/core
Controllers (thin, orchestrate only):
- ProductController: getAll, getById, create, update, delete, searchByBarcode
- OrderController: createOrder, completeOrder, voidOrder, getOrderHistory, getTodaysSummary
- CustomerController: getAll, getById, createCustomer, addLoyaltyPoints
- AuthController: loginWithPin, getCurrentUser, logout
- InventoryController: getLowStockItems, adjustStock, getStockHistory

Services (all business logic lives here):
- CartService: addItem, removeItem, updateQty, applyDiscount, calculateTotals, holdCart, resumeCart
- PaymentService: processCash(amountTendered), processCard, processSplitPayment, calculateChange
- TaxService: applyTax(subtotal, taxRate), getTaxSummary(orders)
- DiscountService: applyPercentDiscount, applyFixedDiscount, validateCoupon
- ReportService: getDailySummary, getTopProducts, getRevenueByCategory

Models:
- Cart.ts: CartItem[], subtotal, tax, discount, total — all computed getters
- Receipt.ts: builds receipt data structure from a completed order

### Step 5 — packages/ipc
- channels.ts: export const IPC = { PRODUCTS: { GET_ALL: 'products:getAll', ... }, ORDERS: {...}, AUTH: {...} } — ALL channels defined here
- handlers.ts: registers all ipcMain.handle() calls, calls controllers, returns typed responses

### Step 6 — apps/desktop (Electron)
main.ts:
- Creates BrowserWindow with security best practices (contextIsolation: true, nodeIntegration: false)
- Loads preload.ts
- Imports and registers all IPC handlers from packages/ipc

preload.ts:
- Exposes a typed window.api object via contextBridge
- One method per IPC channel — fully typed using channel names from packages/ipc

src/ (React renderer):
- App.tsx with React Router routes: /pos, /inventory, /customers, /reports, /settings
- store/cartStore.ts (Zustand): cart items, hold/resume
- store/authStore.ts (Zustand): current user, session
- pages/POSPage.tsx: ProductGrid + Cart side-by-side layout
- pages/InventoryPage.tsx: product table with stock levels
- components/Cart/Cart.tsx, CartItem.tsx, CartSummary.tsx
- components/ProductGrid/ProductGrid.tsx, ProductCard.tsx
- components/PaymentModal/PaymentModal.tsx: cash/card/split tabs
- hooks/useProducts.ts, useCart.ts, useOrders.ts — thin wrappers over window.api

### Step 7 — Testing setup
- jest.config.ts at root using ts-jest
- Unit tests for: CartService, PaymentService, TaxService, DiscountService
- Unit tests for: ProductRepository (using in-memory SQLite)
- Test fixtures in packages/shared/src/__tests__/fixtures/

## File naming conventions
- React components: PascalCase.tsx
- Services, Controllers, Repositories: PascalCase.ts
- Hooks: camelCase prefixed with use
- Types/interfaces: prefix with I (IProduct, IOrder)
- Enums: PascalCase with all-caps values (UserRole.ADMIN)
- Constants: SCREAMING_SNAKE_CASE
- Test files: *.test.ts or *.spec.ts next to the file they test

## Start now
Begin with Step 1 (monorepo setup) and Step 2 (packages/shared) completely before moving to any other step. After each step, confirm what was created and ask before proceeding to the next. Never skip ahead. If you are unsure about any architectural decision, ask me before implementing.