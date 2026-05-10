/**
 * Standard envelope for every IPC response.
 * The renderer always receives this shape — it never receives a raw thrown error.
 */
export type IpcResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Wraps a successful value in an IpcResponse.
 */
export function ipcOk<T>(data: T): IpcResponse<T> {
  return { success: true, data };
}

/**
 * Wraps an error message in an IpcResponse.
 */
export function ipcErr<T>(message: string): IpcResponse<T> {
  return { success: false, error: message };
}

/**
 * Converts a Result<T, Error> from the core layer into an IpcResponse<T>.
 */
export function fromResult<T>(
  result: { success: true; data: T } | { success: false; error: Error },
): IpcResponse<T> {
  if (result.success) return ipcOk(result.data);
  return ipcErr(result.error.message);
}

// ─── Typed argument shapes for each handler ──────────────────────────────────
// These mirror what the preload's window.api methods accept.
// Keeping them here avoids duplicating types in both handlers.ts and preload.ts.

import type {
  CreateProductDTO,
  UpdateProductDTO,
  CreateOrderDTO,
  PaymentDTO,
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CreateUserDTO,
  UpdateUserDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from '@my-pos/shared';

export interface ProductGetByIdArgs { id: number }
export interface ProductSearchArgs { query: string }
export interface ProductSearchByBarcodeArgs { barcode: string }
export interface ProductCreateArgs { dto: CreateProductDTO }
export interface ProductUpdateArgs { id: number; dto: UpdateProductDTO }
export interface ProductDeleteArgs { id: number }

export interface OrderGetByIdArgs { id: number }
export interface OrderCreateArgs { dto: CreateOrderDTO }
export interface OrderCompleteArgs { orderId: number; payment: PaymentDTO; userId: number }
export interface OrderVoidArgs { orderId: number; userId: number }

export interface CustomerGetByIdArgs { id: number }
export interface CustomerCreateArgs { dto: CreateCustomerDTO }
export interface CustomerUpdateArgs { id: number; dto: UpdateCustomerDTO }
export interface CustomerAddLoyaltyArgs { customerId: number; orderTotalInCents: number }

export interface AuthLoginArgs { username: string; pin: string }
export interface AuthCreateUserArgs { dto: CreateUserDTO }
export interface AuthUpdateUserArgs { id: number; dto: UpdateUserDTO }

export interface InventoryAdjustArgs { productId: number; delta: number; userId: number; reason: string }
export interface InventoryStockHistoryArgs { productId: number }

export interface ReportDailySummaryArgs { date: string }
export interface ReportTopProductsArgs { from: string; to: string; limit?: number }
export interface ReportRevenueByCategoryArgs { from: string; to: string }

export interface CategoryCreateArgs { dto: CreateCategoryDTO }
export interface CategoryUpdateArgs { id: number; dto: UpdateCategoryDTO }
export interface CategoryDeleteArgs { id: number }
