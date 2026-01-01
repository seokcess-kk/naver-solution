import { DataSource } from 'typeorm';
import { KeywordRepository } from '@infrastructure/repositories/KeywordRepository';
import { Keyword } from '@domain/entities/Keyword';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { KeywordFixture } from '@tests/fixtures/keywords';
import { NotFoundError } from '@application/errors/HttpError';

describe('KeywordRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: KeywordRepository;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new KeywordRepository(dataSource);
  });

  describe('save', () => {
    it('should save a new keyword to database', async () => {
      const keyword = KeywordFixture.create();
      const saved = await repository.save(keyword);

      expect(saved.id).toBeDefined();
      expect(saved.keyword).toBe(keyword.keyword);
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should update existing keyword', async () => {
      const keyword = KeywordFixture.create();
      const saved = await repository.save(keyword);

      saved.keyword = '수정된 키워드';
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.keyword).toBe('수정된 키워드');
    });

    it('should enforce unique constraint on keyword text', async () => {
      const keyword1 = KeywordFixture.withKeyword('강남 맛집');
      await repository.save(keyword1);

      const keyword2 = KeywordFixture.withKeyword('강남 맛집');
      await expect(repository.save(keyword2)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find keyword by id', async () => {
      const keyword = KeywordFixture.create();
      const saved = await repository.save(keyword);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.keyword).toBe(saved.keyword);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all keywords with pagination', async () => {
      const keywords = KeywordFixture.createMany(3);
      await Promise.all(keywords.map(k => repository.save(k)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should paginate correctly', async () => {
      const keywords = KeywordFixture.createMany(5);
      await Promise.all(keywords.map(k => repository.save(k)));

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });

    it('should sort by specified field', async () => {
      const keyword1 = await repository.save(KeywordFixture.withKeyword('강남 맛집'));
      const keyword2 = await repository.save(KeywordFixture.withKeyword('서울 카페'));

      const result = await repository.findAll({ sortBy: 'keyword', sortOrder: 'ASC' });

      expect(result.data[0].keyword).toBe('강남 맛집');
      expect(result.data[1].keyword).toBe('서울 카페');
    });

    it('should return empty array when no keywords exist', async () => {
      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findByKeyword', () => {
    it('should find keyword by exact keyword text', async () => {
      const keyword = KeywordFixture.withKeyword('강남 맛집');
      const saved = await repository.save(keyword);

      const found = await repository.findByKeyword('강남 맛집');

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.keyword).toBe('강남 맛집');
    });

    it('should return null for non-existent keyword text', async () => {
      const found = await repository.findByKeyword('non-existent-keyword');
      expect(found).toBeNull();
    });

    it('should be case sensitive', async () => {
      await repository.save(KeywordFixture.withKeyword('강남 맛집'));

      const found = await repository.findByKeyword('강남 맛집');
      const notFound = await repository.findByKeyword('강남 맛집 '); // Different - trailing space

      expect(found).not.toBeNull();
      expect(notFound).toBeNull();
    });
  });

  describe('findOrCreate', () => {
    it('should return existing keyword if it exists', async () => {
      const existing = KeywordFixture.withKeyword('강남 맛집');
      const saved = await repository.save(existing);

      const found = await repository.findOrCreate('강남 맛집');

      expect(found.id).toBe(saved.id);
      expect(found.keyword).toBe('강남 맛집');
    });

    it('should create new keyword if it does not exist', async () => {
      const created = await repository.findOrCreate('새로운 키워드');

      expect(created.id).toBeDefined();
      expect(created.keyword).toBe('새로운 키워드');
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    it('should not create duplicate when called concurrently', async () => {
      // Note: SQLite doesn't handle concurrent transactions like PostgreSQL
      // One call may fail with unique constraint error, which is acceptable
      const results = await Promise.allSettled([
        repository.findOrCreate('동시성 테스트'),
        repository.findOrCreate('동시성 테스트'),
      ]);

      // At least one should succeed
      const successful = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      expect(successful.length).toBeGreaterThanOrEqual(1);

      // All successful results should have the same keyword
      successful.forEach(result => {
        expect(result.value.keyword).toBe('동시성 테스트');
      });

      // Only one keyword should exist in database
      const count = await repository.count();
      expect(count).toBe(1);
    });
  });

  describe('update', () => {
    it('should update keyword text', async () => {
      const keyword = KeywordFixture.create();
      const saved = await repository.save(keyword);

      const updated = await repository.update(saved.id, {
        keyword: '업데이트된 키워드',
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.keyword).toBe('업데이트된 키워드');
    });

    it('should throw NotFoundError when keyword does not exist', async () => {
      await expect(repository.update('non-existent-id', { keyword: 'new' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete keyword', async () => {
      const keyword = KeywordFixture.create();
      const saved = await repository.save(keyword);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent keyword', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing keyword', async () => {
      const keyword = KeywordFixture.create();
      const saved = await repository.save(keyword);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keyword', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('existsByKeyword', () => {
    it('should return true for existing keyword text', async () => {
      await repository.save(KeywordFixture.withKeyword('강남 맛집'));

      const exists = await repository.existsByKeyword('강남 맛집');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent keyword text', async () => {
      const exists = await repository.existsByKeyword('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of keywords', async () => {
      const keywords = KeywordFixture.createMany(3);
      await Promise.all(keywords.map(k => repository.save(k)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no keywords exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});
