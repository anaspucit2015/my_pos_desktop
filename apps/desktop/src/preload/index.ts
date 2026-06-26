import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@my-pos/ipc/channels';

/**
 * Exposes a fully-typed `window.api` object to the renderer via contextBridge.
 * Each method maps 1-to-1 with an IPC channel defined in packages/ipc/src/channels.ts.
 * The renderer never touches ipcRenderer directly.
 */
contextBridge.exposeInMainWorld('api', {
  products: {
    /** Fetch all active products. */
    getAll: () => ipcRenderer.invoke(IPC.PRODUCTS.GET_ALL),
    /** Fetch a product by its numeric ID. */
    getById: (id: number) => ipcRenderer.invoke(IPC.PRODUCTS.GET_BY_ID, { id }),
    /** Full-text search by name / SKU. */
    search: (query: string) => ipcRenderer.invoke(IPC.PRODUCTS.SEARCH, { query }),
    /** Look up a product by its barcode string. */
    searchByBarcode: (barcode: string) =>
      ipcRenderer.invoke(IPC.PRODUCTS.SEARCH_BY_BARCODE, { barcode }),
    /** Create a new product. */
    create: (dto: unknown) => ipcRenderer.invoke(IPC.PRODUCTS.CREATE, { dto }),
    /** Update an existing product. */
    update: (id: number, dto: unknown) => ipcRenderer.invoke(IPC.PRODUCTS.UPDATE, { id, dto }),
    /** Soft-delete a product. */
    delete: (id: number) => ipcRenderer.invoke(IPC.PRODUCTS.DELETE, { id }),
  },

  orders: {
    /** Fetch all orders. */
    getAll: () => ipcRenderer.invoke(IPC.ORDERS.GET_ALL),
    /** Fetch a single order with its items and payments. */
    getById: (id: number) => ipcRenderer.invoke(IPC.ORDERS.GET_BY_ID, { id }),
    /** Create a new pending order. */
    create: (dto: unknown) => ipcRenderer.invoke(IPC.ORDERS.CREATE, { dto }),
    /** Complete an order and record its payment. */
    complete: (orderId: number, payment: unknown, userId: number) =>
      ipcRenderer.invoke(IPC.ORDERS.COMPLETE, { orderId, payment, userId }),
    /** Void an order. */
    void: (orderId: number, userId: number) =>
      ipcRenderer.invoke(IPC.ORDERS.VOID, { orderId, userId }),
    /** Get today's order summary (revenue, count, etc.). */
    getTodaySummary: () => ipcRenderer.invoke(IPC.ORDERS.GET_TODAY_SUMMARY),
  },

  customers: {
    /** Fetch all customers. */
    getAll: () => ipcRenderer.invoke(IPC.CUSTOMERS.GET_ALL),
    /** Fetch a customer by ID. */
    getById: (id: number) => ipcRenderer.invoke(IPC.CUSTOMERS.GET_BY_ID, { id }),
    /** Register a new customer. */
    create: (dto: unknown) => ipcRenderer.invoke(IPC.CUSTOMERS.CREATE, { dto }),
    /** Update a customer's profile. */
    update: (id: number, dto: unknown) => ipcRenderer.invoke(IPC.CUSTOMERS.UPDATE, { id, dto }),
    /** Add loyalty points after a completed order. */
    addLoyaltyPoints: (customerId: number, orderTotalInCents: number) =>
      ipcRenderer.invoke(IPC.CUSTOMERS.ADD_LOYALTY_POINTS, { customerId, orderTotalInCents }),
  },

  auth: {
    /** Authenticate a user with username + PIN. */
    login: (username: string, pin: string) =>
      ipcRenderer.invoke(IPC.AUTH.LOGIN, { username, pin }),
    /** Return the currently logged-in user, or an error if no session. */
    getCurrentUser: () => ipcRenderer.invoke(IPC.AUTH.GET_CURRENT_USER),
    /** Clear the active session. */
    logout: () => ipcRenderer.invoke(IPC.AUTH.LOGOUT),
    /** Create a new user account (admin only). */
    createUser: (dto: unknown) => ipcRenderer.invoke(IPC.AUTH.CREATE_USER, { dto }),
    /** List all users (admin only). */
    getAllUsers: () => ipcRenderer.invoke(IPC.AUTH.GET_ALL_USERS),
    /** Update a user's details or active status (admin only). */
    updateUser: (id: number, dto: unknown) => ipcRenderer.invoke(IPC.AUTH.UPDATE_USER, { id, dto }),
  },

  inventory: {
    /** Get all products below their low-stock threshold. */
    getLowStock: () => ipcRenderer.invoke(IPC.INVENTORY.GET_LOW_STOCK),
    /** Adjust stock quantity for a product (positive = restock, negative = shrinkage). */
    adjustStock: (productId: number, delta: number, userId: number, reason: string) =>
      ipcRenderer.invoke(IPC.INVENTORY.ADJUST_STOCK, { productId, delta, userId, reason }),
    /** Get stock adjustment history for a product. */
    getStockHistory: (productId: number) =>
      ipcRenderer.invoke(IPC.INVENTORY.GET_STOCK_HISTORY, { productId }),
  },

  reports: {
    /** Get revenue and order count for a given date (ISO string). */
    getDailySummary: (date: string) =>
      ipcRenderer.invoke(IPC.REPORTS.GET_DAILY_SUMMARY, { date }),
    /** Get aggregated summary across a date range (ISO strings). */
    getRangeSummary: (from: string, to: string) =>
      ipcRenderer.invoke(IPC.REPORTS.GET_RANGE_SUMMARY, { from, to }),
    /** Get top-selling products in a date range. */
    getTopProducts: (from: string, to: string, limit?: number) =>
      ipcRenderer.invoke(IPC.REPORTS.GET_TOP_PRODUCTS, { from, to, limit }),
    /** Get revenue broken down by product category. */
    getRevenueByCategory: (from: string, to: string) =>
      ipcRenderer.invoke(IPC.REPORTS.GET_REVENUE_BY_CATEGORY, { from, to }),
  },

  categories: {
    /** Fetch all product categories. */
    getAll: () => ipcRenderer.invoke(IPC.CATEGORIES.GET_ALL),
    /** Create a new category (admin only). */
    create: (dto: unknown) => ipcRenderer.invoke(IPC.CATEGORIES.CREATE, { dto }),
    /** Update an existing category (admin only). */
    update: (id: number, dto: unknown) => ipcRenderer.invoke(IPC.CATEGORIES.UPDATE, { id, dto }),
    /** Delete a category (admin only). */
    delete: (id: number) => ipcRenderer.invoke(IPC.CATEGORIES.DELETE, { id }),
  },

  returns: {
    /** Process a return for one or more items from a completed order. */
    process: (dto: unknown) => ipcRenderer.invoke(IPC.RETURNS.PROCESS, { dto }),
    /** Get all return transactions for a given order. */
    getByOrder: (orderId: number) => ipcRenderer.invoke(IPC.RETURNS.GET_BY_ORDER, { orderId }),
  },
});
