import { ok, err, type Result } from '@my-pos/shared';
import type { IProduct, IProductCategory, CreateProductDTO, UpdateProductDTO, CreateCategoryDTO, UpdateCategoryDTO } from '@my-pos/shared';
import type { ProductRepository } from '@my-pos/database';

/**
 * Controller for product operations.
 * Orchestrates calls to ProductRepository — contains no business logic itself.
 */
export class ProductController {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * Returns all active products.
   */
  async getAll(): Promise<Result<IProduct[], Error>> {
    return this.productRepository.findAll();
  }

  /**
   * Returns a single product by ID, or an error if not found.
   */
  async getById(id: number): Promise<Result<IProduct, Error>> {
    const result = await this.productRepository.findById(id);
    if (!result.success) return result;
    if (!result.data) return err(new Error(`Product ${id} not found`));
    return ok(result.data);
  }

  /**
   * Searches for a product by its barcode.
   * Returns an error if the barcode does not match any product.
   */
  async searchByBarcode(barcode: string): Promise<Result<IProduct, Error>> {
    if (!barcode.trim()) return err(new Error('Barcode cannot be empty'));
    const result = await this.productRepository.findByBarcode(barcode);
    if (!result.success) return result;
    if (!result.data) return err(new Error(`No product found with barcode: ${barcode}`));
    return ok(result.data);
  }

  /**
   * Searches products by name using a partial match.
   */
  async search(query: string): Promise<Result<IProduct[], Error>> {
    if (!query.trim()) return this.productRepository.findAll();
    return this.productRepository.search(query);
  }

  /**
   * Creates a new product.
   */
  async create(dto: CreateProductDTO): Promise<Result<IProduct, Error>> {
    if (dto.priceInCents <= 0) return err(new Error('Price must be greater than zero'));
    if (dto.costInCents < 0) return err(new Error('Cost cannot be negative'));
    return this.productRepository.create(dto);
  }

  /**
   * Updates an existing product.
   */
  async update(id: number, dto: UpdateProductDTO): Promise<Result<IProduct, Error>> {
    if (dto.priceInCents !== undefined && dto.priceInCents <= 0) {
      return err(new Error('Price must be greater than zero'));
    }
    return this.productRepository.update(id, dto);
  }

  /**
   * Soft-deletes a product by marking it inactive.
   */
  async delete(id: number): Promise<Result<void, Error>> {
    return this.productRepository.delete(id);
  }

  /**
   * Returns all product categories.
   */
  async getAllCategories(): Promise<Result<IProductCategory[], Error>> {
    return this.productRepository.findAllCategories();
  }

  /**
   * Creates a new product category.
   */
  async createCategory(dto: CreateCategoryDTO): Promise<Result<IProductCategory, Error>> {
    if (!dto.name.trim()) return err(new Error('Category name is required'));
    return this.productRepository.createCategory(dto);
  }

  /**
   * Updates an existing category.
   */
  async updateCategory(id: number, dto: UpdateCategoryDTO): Promise<Result<IProductCategory, Error>> {
    if (dto.name !== undefined && !dto.name.trim()) {
      return err(new Error('Category name cannot be empty'));
    }
    return this.productRepository.updateCategory(id, dto);
  }

  /**
   * Deletes a category. Products in this category will have their category cleared.
   */
  async deleteCategory(id: number): Promise<Result<void, Error>> {
    return this.productRepository.deleteCategory(id);
  }
}
