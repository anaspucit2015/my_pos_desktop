import { ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';

import type { Db } from '@my-pos/database';
import {
  ProductRepository,
  OrderRepository,
  CustomerRepository,
  UserRepository,
  ReturnRepository,
} from '@my-pos/database';

import {
  ProductController,
  OrderController,
  CustomerController,
  AuthController,
  InventoryController,
  ReturnController,
  ReportService,
} from '@my-pos/core';

import { UserRole } from '@my-pos/shared';
import { IPC } from './channels.js';
import { fromResult, ipcOk, ipcErr, type IpcResponse } from './types.js';
import type {
  ProductGetByIdArgs,
  ProductSearchArgs,
  ProductSearchByBarcodeArgs,
  ProductCreateArgs,
  ProductUpdateArgs,
  ProductDeleteArgs,
  OrderGetByIdArgs,
  OrderCreateArgs,
  OrderCompleteArgs,
  OrderVoidArgs,
  CustomerGetByIdArgs,
  CustomerCreateArgs,
  CustomerUpdateArgs,
  CustomerAddLoyaltyArgs,
  AuthLoginArgs,
  AuthCreateUserArgs,
  AuthUpdateUserArgs,
  InventoryAdjustArgs,
  InventoryStockHistoryArgs,
  ReportDailySummaryArgs,
  ReportRangeSummaryArgs,
  ReportTopProductsArgs,
  ReportRevenueByCategoryArgs,
  CategoryCreateArgs,
  CategoryUpdateArgs,
  CategoryDeleteArgs,
  ReturnProcessArgs,
  ReturnGetByOrderArgs,
} from './types.js';

/**
 * Registers all ipcMain handlers for the POS application.
 * Call once from main.ts after the app is ready.
 *
 * @param db - The active Drizzle database instance.
 */
export function registerHandlers(db: Db): void {
  // ── Dependency injection ────────────────────────────────────────────────────
  const productRepo = new ProductRepository(db);
  const orderRepo = new OrderRepository(db);
  const customerRepo = new CustomerRepository(db);
  const userRepo = new UserRepository(db);
  const returnRepo = new ReturnRepository(db);

  const productController = new ProductController(productRepo);
  const orderController = new OrderController(orderRepo, productRepo);
  const customerController = new CustomerController(customerRepo);
  const authController = new AuthController(userRepo);
  const inventoryController = new InventoryController(productRepo);
  const returnController = new ReturnController(returnRepo, orderRepo, productRepo);
  const reportService = new ReportService(orderRepo);

  // ── Helper: wraps an async handler so uncaught throws become IpcResponse errors ──
  function handle<TArgs, TResult>(
    channel: string,
    fn: (_event: IpcMainInvokeEvent, args: TArgs) => Promise<IpcResponse<TResult>>,
  ): void {
    ipcMain.handle(channel, async (event, args: TArgs) => {
      try {
        return await fn(event, args);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`[IPC] Unhandled error on "${channel}":`, message);
        return ipcErr<TResult>(message);
      }
    });
  }

  // ── Helper: returns true only when the active session is an ADMIN ──────────
  function isAdmin(): boolean {
    return authController.getCurrentUser()?.role === UserRole.ADMIN;
  }

  // ── Products ────────────────────────────────────────────────────────────────

  handle<void, ReturnType<typeof productController.getAll> extends Promise<infer R> ? R extends { data: infer D } ? D : never : never>(
    IPC.PRODUCTS.GET_ALL,
    async () => fromResult(await productController.getAll()),
  );

  handle<ProductGetByIdArgs, unknown>(
    IPC.PRODUCTS.GET_BY_ID,
    async (_e, { id }) => fromResult(await productController.getById(id)),
  );

  handle<ProductSearchArgs, unknown>(
    IPC.PRODUCTS.SEARCH,
    async (_e, { query }) => fromResult(await productController.search(query)),
  );

  handle<ProductSearchByBarcodeArgs, unknown>(
    IPC.PRODUCTS.SEARCH_BY_BARCODE,
    async (_e, { barcode }) => fromResult(await productController.searchByBarcode(barcode)),
  );

  handle<ProductCreateArgs, unknown>(
    IPC.PRODUCTS.CREATE,
    async (_e, { dto }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await productController.create(dto));
    },
  );

  handle<ProductUpdateArgs, unknown>(
    IPC.PRODUCTS.UPDATE,
    async (_e, { id, dto }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await productController.update(id, dto));
    },
  );

  handle<ProductDeleteArgs, void>(
    IPC.PRODUCTS.DELETE,
    async (_e, { id }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await productController.delete(id));
    },
  );

  // ── Orders ──────────────────────────────────────────────────────────────────

  handle<void, unknown>(
    IPC.ORDERS.GET_ALL,
    async () => fromResult(await orderController.getOrderHistory()),
  );

  handle<OrderGetByIdArgs, unknown>(
    IPC.ORDERS.GET_BY_ID,
    async (_e, { id }) => fromResult(await orderController.getById(id)),
  );

  handle<OrderCreateArgs, unknown>(
    IPC.ORDERS.CREATE,
    async (_e, { dto }) => fromResult(await orderController.createOrder(dto)),
  );

  handle<OrderCompleteArgs, unknown>(
    IPC.ORDERS.COMPLETE,
    async (_e, { orderId, payment, userId }) =>
      fromResult(await orderController.completeOrder(orderId, payment, userId)),
  );

  handle<OrderVoidArgs, unknown>(
    IPC.ORDERS.VOID,
    async (_e, { orderId, userId }) =>
      fromResult(await orderController.voidOrder(orderId, userId)),
  );

  handle<void, unknown>(
    IPC.ORDERS.GET_TODAY_SUMMARY,
    async () => fromResult(await orderController.getTodaysSummary()),
  );

  // ── Customers ───────────────────────────────────────────────────────────────

  handle<void, unknown>(
    IPC.CUSTOMERS.GET_ALL,
    async () => fromResult(await customerController.getAll()),
  );

  handle<CustomerGetByIdArgs, unknown>(
    IPC.CUSTOMERS.GET_BY_ID,
    async (_e, { id }) => fromResult(await customerController.getById(id)),
  );

  handle<CustomerCreateArgs, unknown>(
    IPC.CUSTOMERS.CREATE,
    async (_e, { dto }) => fromResult(await customerController.createCustomer(dto)),
  );

  handle<CustomerUpdateArgs, unknown>(
    IPC.CUSTOMERS.UPDATE,
    async (_e, { id, dto }) => fromResult(await customerController.update(id, dto)),
  );

  handle<CustomerAddLoyaltyArgs, unknown>(
    IPC.CUSTOMERS.ADD_LOYALTY_POINTS,
    async (_e, { customerId, orderTotalInCents }) =>
      fromResult(await customerController.addLoyaltyPoints(customerId, orderTotalInCents)),
  );

  // ── Auth ────────────────────────────────────────────────────────────────────

  handle<AuthLoginArgs, unknown>(
    IPC.AUTH.LOGIN,
    async (_e, { username, pin }) =>
      fromResult(await authController.loginWithPin(username, pin)),
  );

  handle<void, unknown>(
    IPC.AUTH.GET_CURRENT_USER,
    async () => {
      const user = authController.getCurrentUser();
      return user ? ipcOk(user) : ipcErr('No active session');
    },
  );

  handle<void, void>(
    IPC.AUTH.LOGOUT,
    async () => {
      authController.logout();
      return ipcOk(undefined);
    },
  );

  handle<AuthCreateUserArgs, unknown>(
    IPC.AUTH.CREATE_USER,
    async (_e, { dto }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await authController.createUser(dto));
    },
  );

  handle<void, unknown>(
    IPC.AUTH.GET_ALL_USERS,
    async () => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await authController.getUsers());
    },
  );

  handle<AuthUpdateUserArgs, unknown>(
    IPC.AUTH.UPDATE_USER,
    async (_e, { id, dto }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await authController.updateUser(id, dto));
    },
  );

  // ── Inventory ───────────────────────────────────────────────────────────────

  handle<void, unknown>(
    IPC.INVENTORY.GET_LOW_STOCK,
    async () => fromResult(await inventoryController.getLowStockItems()),
  );

  handle<InventoryAdjustArgs, unknown>(
    IPC.INVENTORY.ADJUST_STOCK,
    async (_e, { productId, delta, userId, reason }) =>
      fromResult(await inventoryController.adjustStock(productId, delta, userId, reason)),
  );

  handle<InventoryStockHistoryArgs, unknown>(
    IPC.INVENTORY.GET_STOCK_HISTORY,
    async (_e, { productId }) =>
      fromResult(await inventoryController.getStockHistory(productId)),
  );

  // ── Categories ──────────────────────────────────────────────────────────────

  handle<void, unknown>(
    IPC.CATEGORIES.GET_ALL,
    async () => fromResult(await productController.getAllCategories()),
  );

  handle<CategoryCreateArgs, unknown>(
    IPC.CATEGORIES.CREATE,
    async (_e, { dto }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await productController.createCategory(dto));
    },
  );

  handle<CategoryUpdateArgs, unknown>(
    IPC.CATEGORIES.UPDATE,
    async (_e, { id, dto }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await productController.updateCategory(id, dto));
    },
  );

  handle<CategoryDeleteArgs, void>(
    IPC.CATEGORIES.DELETE,
    async (_e, { id }) => {
      if (!isAdmin()) return ipcErr('Admin access required');
      return fromResult(await productController.deleteCategory(id));
    },
  );

  // ── Reports ─────────────────────────────────────────────────────────────────

  handle<ReportDailySummaryArgs, unknown>(
    IPC.REPORTS.GET_DAILY_SUMMARY,
    async (_e, { date }) =>
      fromResult(await reportService.getDailySummary(new Date(date))),
  );

  handle<ReportRangeSummaryArgs, unknown>(
    IPC.REPORTS.GET_RANGE_SUMMARY,
    async (_e, { from, to }) =>
      fromResult(await reportService.getRangeSummary(new Date(from), new Date(to))),
  );

  handle<ReportTopProductsArgs, unknown>(
    IPC.REPORTS.GET_TOP_PRODUCTS,
    async (_e, { from, to, limit }) =>
      fromResult(await reportService.getTopProducts(new Date(from), new Date(to), limit)),
  );

  handle<ReportRevenueByCategoryArgs, unknown>(
    IPC.REPORTS.GET_REVENUE_BY_CATEGORY,
    async (_e, { from, to }) =>
      fromResult(await reportService.getRevenueByCategory(new Date(from), new Date(to))),
  );

  // ── Returns ─────────────────────────────────────────────────────────────────

  handle<ReturnProcessArgs, unknown>(
    IPC.RETURNS.PROCESS,
    async (_e, { dto }) => fromResult(await returnController.processReturn(dto)),
  );

  handle<ReturnGetByOrderArgs, unknown>(
    IPC.RETURNS.GET_BY_ORDER,
    async (_e, { orderId }) => fromResult(await returnController.getByOrderId(orderId)),
  );
}

/**
 * Removes all registered IPC handlers.
 * Call during app teardown or in tests to avoid duplicate handler warnings.
 */
export function unregisterHandlers(): void {
  const allChannels: string[] = [
    ...Object.values(IPC.PRODUCTS),
    ...Object.values(IPC.ORDERS),
    ...Object.values(IPC.CUSTOMERS),
    ...Object.values(IPC.AUTH),
    ...Object.values(IPC.INVENTORY),
    ...Object.values(IPC.REPORTS),
    ...Object.values(IPC.CATEGORIES),
    ...Object.values(IPC.RETURNS),
  ];
  for (const channel of allChannels) {
    ipcMain.removeHandler(channel);
  }
}
