/**
 * Pagination options for querying collections
 */
export interface PaginationOptions {
  /** Page number (1-based). Default: 1 */
  page?: number;
  /** Number of items per page. Default: 10 */
  limit?: number;
  /** Field to sort by. Default: 'createdAt' */
  sortBy?: string;
  /** Sort order. Default: 'DESC' */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  /** Array of items for current page */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
}

/**
 * Base Repository Interface
 * Provides common CRUD operations with pagination support.
 * All repository interfaces should extend this interface.
 *
 * @template T - The entity type
 */
export interface IBaseRepository<T> {
  /**
   * Find an entity by its ID
   * @param id - The entity ID
   * @returns The entity if found, null otherwise
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities with optional pagination
   * @param options - Pagination options
   * @returns Paginated result containing entities and metadata
   */
  findAll(options?: PaginationOptions): Promise<PaginatedResult<T>>;

  /**
   * Save a new entity
   * @param entity - The entity to save
   * @returns The saved entity with generated ID
   */
  save(entity: T): Promise<T>;

  /**
   * Update an existing entity
   * @param id - The entity ID to update
   * @param data - Partial entity data to update
   * @returns The updated entity
   * @throws NotFoundError if entity doesn't exist
   */
  update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Delete an entity by ID
   * @param id - The entity ID to delete
   * @returns void
   * @throws NotFoundError if entity doesn't exist
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an entity exists by ID
   * @param id - The entity ID to check
   * @returns true if exists, false otherwise
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count total number of entities
   * @returns Total count
   */
  count(): Promise<number>;
}
