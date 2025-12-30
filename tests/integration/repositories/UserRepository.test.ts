import { DataSource } from 'typeorm';
import { UserRepository } from '@infrastructure/repositories/UserRepository';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('UserRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: UserRepository;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    // Reset database before each test
    await resetDatabase(dataSource);
    repository = new UserRepository(dataSource);
  });

  describe('save', () => {
    it('should save a new user to database', async () => {
      const user = new User();
      user.email = 'test@example.com';
      user.passwordHash = 'hashedPassword123';
      user.name = 'Test User';

      const saved = await repository.save(user);

      expect(saved.id).toBeDefined();
      expect(saved.email).toBe('test@example.com');
      expect(saved.name).toBe('Test User');
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should update existing user', async () => {
      const user = UserFixture.create();
      const saved = await repository.save(user);

      saved.name = 'Updated Name';
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.name).toBe('Updated Name');
      // Note: updatedAt timestamp update is tested separately in update() tests
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = UserFixture.create();
      const saved = await repository.save(user);

      const found = await repository.findById(saved.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(saved.id);
      expect(found!.email).toBe(saved.email);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = UserFixture.withEmail('find@example.com');
      await repository.save(user);

      const found = await repository.findByEmail('find@example.com');

      expect(found).toBeDefined();
      expect(found!.email).toBe('find@example.com');
    });

    it('should return null for non-existent email', async () => {
      const found = await repository.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    it('should be case-insensitive', async () => {
      const user = UserFixture.withEmail('test@example.com');
      await repository.save(user);

      const found = await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(found).toBeDefined();
      expect(found!.email).toBe('test@example.com');
    });
  });

  describe('existsByEmail', () => {
    it('should return true for existing email', async () => {
      const user = UserFixture.withEmail('exists@example.com');
      await repository.save(user);

      const exists = await repository.existsByEmail('exists@example.com');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await repository.existsByEmail('nonexistent@example.com');
      expect(exists).toBe(false);
    });

    it('should be case-insensitive', async () => {
      const user = UserFixture.withEmail('test@example.com');
      await repository.save(user);

      const exists = await repository.existsByEmail('TEST@EXAMPLE.COM');
      expect(exists).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const users = UserFixture.createMany(5);
      for (const user of users) {
        await repository.save(user);
      }

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should paginate correctly', async () => {
      const users = UserFixture.createMany(15);
      for (const user of users) {
        await repository.save(user);
      }

      const page1 = await repository.findAll({ page: 1, limit: 10 });
      const page2 = await repository.findAll({ page: 2, limit: 10 });

      expect(page1.data).toHaveLength(10);
      expect(page2.data).toHaveLength(5);
      expect(page1.pagination.totalPages).toBe(2);
    });

    it('should return empty array when no users exist', async () => {
      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = UserFixture.create();
      const saved = await repository.save(user);

      const updated = await repository.update(saved.id, {
        name: 'New Name',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.email).toBe(saved.email); // Email unchanged
    });

    it('should update updatedAt timestamp', async () => {
      const user = UserFixture.create();
      const saved = await repository.save(user);

      // Wait 1.1s to ensure timestamp difference in SQLite
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const updated = await repository.update(saved.id, { name: 'New Name' });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(saved.updatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const user = UserFixture.create();
      const saved = await repository.save(user);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent user', async () => {
      await expect(repository.delete('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing user', async () => {
      const user = UserFixture.create();
      const saved = await repository.save(user);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of users', async () => {
      const users = UserFixture.createMany(7);
      for (const user of users) {
        await repository.save(user);
      }

      const count = await repository.count();
      expect(count).toBe(7);
    });

    it('should return 0 when no users exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});
