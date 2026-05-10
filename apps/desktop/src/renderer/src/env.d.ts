/// <reference types="vite/client" />

import type { IpcResponse } from '@my-pos/ipc';
import type {
  IProduct,
  IProductCategory,
  IOrder,
  ICustomer,
  IUser,
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

declare global {
  interface Window {
    api: {
      products: {
        getAll(): Promise<IpcResponse<IProduct[]>>;
        getById(id: number): Promise<IpcResponse<IProduct>>;
        search(query: string): Promise<IpcResponse<IProduct[]>>;
        searchByBarcode(barcode: string): Promise<IpcResponse<IProduct>>;
        create(dto: CreateProductDTO): Promise<IpcResponse<IProduct>>;
        update(id: number, dto: UpdateProductDTO): Promise<IpcResponse<IProduct>>;
        delete(id: number): Promise<IpcResponse<void>>;
      };
      orders: {
        getAll(): Promise<IpcResponse<IOrder[]>>;
        getById(id: number): Promise<IpcResponse<IOrder>>;
        create(dto: CreateOrderDTO): Promise<IpcResponse<IOrder>>;
        complete(orderId: number, payment: PaymentDTO, userId: number): Promise<IpcResponse<IOrder>>;
        void(orderId: number, userId: number): Promise<IpcResponse<IOrder>>;
        getTodaySummary(): Promise<IpcResponse<DailySummary>>;
      };
      customers: {
        getAll(): Promise<IpcResponse<ICustomer[]>>;
        getById(id: number): Promise<IpcResponse<ICustomer>>;
        create(dto: CreateCustomerDTO): Promise<IpcResponse<ICustomer>>;
        update(id: number, dto: UpdateCustomerDTO): Promise<IpcResponse<ICustomer>>;
        addLoyaltyPoints(customerId: number, orderTotalInCents: number): Promise<IpcResponse<ICustomer>>;
      };
      auth: {
        login(username: string, pin: string): Promise<IpcResponse<IUser>>;
        getCurrentUser(): Promise<IpcResponse<IUser>>;
        logout(): Promise<IpcResponse<void>>;
        createUser(dto: CreateUserDTO): Promise<IpcResponse<IUser>>;
        getAllUsers(): Promise<IpcResponse<IUser[]>>;
        updateUser(id: number, dto: UpdateUserDTO): Promise<IpcResponse<IUser>>;
      };
      inventory: {
        getLowStock(): Promise<IpcResponse<IProduct[]>>;
        adjustStock(productId: number, delta: number, userId: number, reason: string): Promise<IpcResponse<void>>;
        getStockHistory(productId: number): Promise<IpcResponse<StockAdjustment[]>>;
      };
      reports: {
        getDailySummary(date: string): Promise<IpcResponse<DailySummary>>;
        getTopProducts(from: string, to: string, limit?: number): Promise<IpcResponse<TopProduct[]>>;
        getRevenueByCategory(from: string, to: string): Promise<IpcResponse<CategoryRevenue[]>>;
      };
      categories: {
        getAll(): Promise<IpcResponse<IProductCategory[]>>;
        create(dto: CreateCategoryDTO): Promise<IpcResponse<IProductCategory>>;
        update(id: number, dto: UpdateCategoryDTO): Promise<IpcResponse<IProductCategory>>;
        delete(id: number): Promise<IpcResponse<void>>;
      };
    };
  }

  /**
   * Matches the shape returned by ReportService.getDailySummary and getTodaysSummary.
   * Keep in sync with packages/core/src/services/ReportService.ts DailySummary interface.
   */
  interface DailySummary {
    date: string;
    totalOrders: number;
    completedOrders: number;
    voidedOrders: number;
    totalRevenueInCents: number;
    totalTaxInCents: number;
    totalDiscountInCents: number;
    averageOrderInCents: number;
  }

  interface StockAdjustment {
    id: number;
    productId: number;
    delta: number;
    reason: string;
    userId: number;
    createdAt: string;
  }

  /**
   * Matches packages/core/src/services/ReportService.ts TopProduct interface.
   */
  interface TopProduct {
    productId: number;
    name: string;
    sku: string;
    quantitySold: number;
    revenueInCents: number;
  }

  /**
   * Matches packages/core/src/services/ReportService.ts RevenueByCategory interface.
   */
  interface CategoryRevenue {
    categoryId: number | null;
    categoryName: string;
    revenueInCents: number;
    orderCount: number;
  }
}
