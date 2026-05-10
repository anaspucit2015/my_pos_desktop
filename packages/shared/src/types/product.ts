/**
 * Represents a product category in the POS system.
 */
export interface IProductCategory {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a product available for sale.
 */
export interface IProduct {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: number | null;
  category: IProductCategory | null;
  /** Price in cents to avoid floating-point issues */
  priceInCents: number;
  costInCents: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data required to create a new product.
 */
export interface CreateProductDTO {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: number;
  priceInCents: number;
  costInCents: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  imageUrl?: string;
}

/**
 * Data required to create a new product category.
 */
export interface CreateCategoryDTO {
  name: string;
  description?: string;
}

/**
 * Data for updating an existing category. All fields optional.
 */
export interface UpdateCategoryDTO {
  name?: string;
  description?: string | null;
}

/**
 * Data for updating an existing product. All fields optional.
 */
export interface UpdateProductDTO {
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  categoryId?: number | null;
  priceInCents?: number;
  costInCents?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  imageUrl?: string | null;
}
