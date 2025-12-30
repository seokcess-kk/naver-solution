import { Application } from 'express';
import { DataSource } from 'typeorm';
import { DIContainer } from '@presentation/api/config/DIContainer';
import { createApp } from '@presentation/api/app';
import { createTestDataSource, resetDatabase as resetDatabaseSchema } from './database.helper';
import { AuthTestHelper } from './auth.helper';

/**
 * E2E Test Context
 * Contains all resources needed for end-to-end API testing
 */
export interface E2ETestContext {
  app: Application;           // Express app instance for supertest
  dataSource: DataSource;     // SQLite in-memory database
  container: DIContainer;     // Dependency injection container
  authHelper: AuthTestHelper; // Authentication helper utilities
}

/**
 * Setup E2E test environment
 * Creates all necessary resources for API testing:
 * - In-memory SQLite database
 * - DI container with all services
 * - Express application
 * - Auth helper for JWT tokens
 *
 * Use this in beforeAll() hooks
 *
 * @returns E2ETestContext with all resources
 *
 * @example
 * ```typescript
 * let context: E2ETestContext;
 *
 * beforeAll(async () => {
 *   context = await setupE2ETest();
 * });
 * ```
 */
export async function setupE2ETest(): Promise<E2ETestContext> {
  // Set test environment variables before initializing services
  process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-testing';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.BCRYPT_SALT_ROUNDS = '10';

  // Create test database (SQLite in-memory)
  const dataSource = await createTestDataSource();

  // Initialize DI container with test database
  const container = DIContainer.getInstance(dataSource);

  // Create Express app with all routes and middleware
  const app = createApp(container);

  // Create auth helper for generating test tokens
  const authHelper = new AuthTestHelper();

  return {
    app,
    dataSource,
    container,
    authHelper,
  };
}

/**
 * Teardown E2E test environment
 * Cleans up all resources created during testing
 *
 * Use this in afterAll() hooks
 *
 * @param context - The E2E test context to clean up
 *
 * @example
 * ```typescript
 * afterAll(async () => {
 *   await teardownE2ETest(context);
 * });
 * ```
 */
export async function teardownE2ETest(context: E2ETestContext): Promise<void> {
  // Close database connection
  if (context.dataSource && context.dataSource.isInitialized) {
    await context.dataSource.destroy();
  }
}

/**
 * Reset test database between tests
 * Drops and recreates all tables to ensure clean state
 *
 * Use this in beforeEach() hooks for test isolation
 *
 * @param context - The E2E test context containing dataSource
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await resetTestDatabase(context);
 * });
 * ```
 */
export async function resetTestDatabase(context: E2ETestContext): Promise<void> {
  await resetDatabaseSchema(context.dataSource);
}
