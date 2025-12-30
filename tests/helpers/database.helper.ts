import { DataSource } from 'typeorm';
import { User } from '@domain/entities/User';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { Review } from '@domain/entities/Review';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { Competitor } from '@domain/entities/Competitor';
import { CompetitorSnapshot } from '@domain/entities/CompetitorSnapshot';
import { NotificationSetting } from '@domain/entities/NotificationSetting';
import { NotificationLog } from '@domain/entities/NotificationLog';
import { RefreshToken } from '@domain/entities/RefreshToken';

/**
 * Create a test DataSource using SQLite in-memory database
 * Fast and requires no external dependencies
 */
export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [
      User,
      Place,
      Keyword,
      PlaceKeyword,
      RankingHistory,
      Review,
      ReviewHistory,
      Competitor,
      CompetitorSnapshot,
      NotificationSetting,
      NotificationLog,
      RefreshToken,
    ],
    synchronize: true, // OK for testing - creates schema automatically
    logging: false, // Set to true for debugging
    dropSchema: true, // Drop schema before each test suite to ensure clean state
  });

  await dataSource.initialize();
  return dataSource;
}

/**
 * Clear all data from test database
 * Useful for cleanup between tests
 */
export async function clearDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;

  // Delete in reverse order to respect foreign key constraints
  for (const entity of entities.reverse()) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
}

/**
 * Close and destroy the test database connection
 */
export async function closeTestDataSource(dataSource: DataSource): Promise<void> {
  if (dataSource && dataSource.isInitialized) {
    await dataSource.destroy();
  }
}

/**
 * Reset database schema - drops and recreates all tables
 * More thorough than clearDatabase, but slower
 */
export async function resetDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.synchronize(true); // true = drop schema before sync
}
