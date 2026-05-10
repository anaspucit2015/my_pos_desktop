export { IPC, type IpcChannel } from './channels.js';
export {
  type IpcResponse,
  ipcOk,
  ipcErr,
  fromResult,
} from './types.js';
export type {
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
  InventoryAdjustArgs,
  InventoryStockHistoryArgs,
  ReportDailySummaryArgs,
  ReportTopProductsArgs,
  ReportRevenueByCategoryArgs,
} from './types.js';
export { registerHandlers, unregisterHandlers } from './handlers.js';
