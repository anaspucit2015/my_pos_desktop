/**
 * ALL IPC channel names are defined here and nowhere else.
 * Both the main-process handlers and the preload bridge import from this file.
 * Using `as const` gives each value a literal type so TypeScript can catch typos.
 */
export const IPC = {
  PRODUCTS: {
    GET_ALL: 'products:getAll',
    GET_BY_ID: 'products:getById',
    SEARCH: 'products:search',
    SEARCH_BY_BARCODE: 'products:searchByBarcode',
    CREATE: 'products:create',
    UPDATE: 'products:update',
    DELETE: 'products:delete',
  },

  ORDERS: {
    GET_ALL: 'orders:getAll',
    GET_BY_ID: 'orders:getById',
    CREATE: 'orders:create',
    COMPLETE: 'orders:complete',
    VOID: 'orders:void',
    GET_TODAY_SUMMARY: 'orders:getTodaySummary',
  },

  CUSTOMERS: {
    GET_ALL: 'customers:getAll',
    GET_BY_ID: 'customers:getById',
    CREATE: 'customers:create',
    UPDATE: 'customers:update',
    ADD_LOYALTY_POINTS: 'customers:addLoyaltyPoints',
  },

  AUTH: {
    LOGIN: 'auth:login',
    GET_CURRENT_USER: 'auth:getCurrentUser',
    LOGOUT: 'auth:logout',
    CREATE_USER: 'auth:createUser',
    GET_ALL_USERS: 'auth:getAllUsers',
    UPDATE_USER: 'auth:updateUser',
  },

  INVENTORY: {
    GET_LOW_STOCK: 'inventory:getLowStock',
    ADJUST_STOCK: 'inventory:adjustStock',
    GET_STOCK_HISTORY: 'inventory:getStockHistory',
  },

  REPORTS: {
    GET_DAILY_SUMMARY: 'reports:getDailySummary',
    GET_RANGE_SUMMARY: 'reports:getRangeSummary',
    GET_TOP_PRODUCTS: 'reports:getTopProducts',
    GET_REVENUE_BY_CATEGORY: 'reports:getRevenueByCategory',
  },

  CATEGORIES: {
    GET_ALL: 'categories:getAll',
    CREATE: 'categories:create',
    UPDATE: 'categories:update',
    DELETE: 'categories:delete',
  },

  RETURNS: {
    PROCESS: 'returns:process',
    GET_BY_ORDER: 'returns:getByOrder',
  },
} as const;

/** Union of every channel string — useful for validation and exhaustiveness checks */
type ChannelGroup = (typeof IPC)[keyof typeof IPC];
export type IpcChannel = ChannelGroup[keyof ChannelGroup];
