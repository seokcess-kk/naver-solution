import { DataSource } from 'typeorm';
import { RankingHistoryRepository } from '@infrastructure/repositories/RankingHistoryRepository';
import { RankingHistory } from '@domain/entities/RankingHistory';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { RankingHistoryFixture } from '@tests/fixtures/rankings';
import { PlaceKeywordFixture } from '@tests/fixtures/placeKeywords';
import { PlaceFixture } from '@tests/fixtures/places';
import { KeywordFixture } from '@tests/fixtures/keywords';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('RankingHistoryRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: RankingHistoryRepository;
  let testUser: User;
  let testPlace: Place;
  let testKeyword: Keyword;
  let testPlaceKeyword: PlaceKeyword;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new RankingHistoryRepository(dataSource);

    // Create test dependencies
    const userRepo = dataSource.getRepository(User);
    testUser = UserFixture.create();
    testUser = await userRepo.save(testUser);

    const placeRepo = dataSource.getRepository(Place);
    testPlace = PlaceFixture.create(testUser);
    testPlace = await placeRepo.save(testPlace);

    const keywordRepo = dataSource.getRepository(Keyword);
    testKeyword = KeywordFixture.create();
    testKeyword = await keywordRepo.save(testKeyword);

    const placeKeywordRepo = dataSource.getRepository(PlaceKeyword);
    testPlaceKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
    testPlaceKeyword = await placeKeywordRepo.save(testPlaceKeyword);
  });

  describe('save', () => {
    it('should save a new ranking history to database', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      const saved = await repository.save(ranking);

      expect(saved.id).toBeDefined();
      expect(saved.rank).toBe(ranking.rank);
      expect(saved.searchResultCount).toBe(ranking.searchResultCount);
      expect(saved.checkedAt).toBeInstanceOf(Date);
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should update existing ranking history', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      const saved = await repository.save(ranking);

      saved.rank = 5;
      saved.searchResultCount = 250;
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.rank).toBe(5);
      expect(updated.searchResultCount).toBe(250);
    });

    it('should save ranking with null rank (not found)', async () => {
      const ranking = RankingHistoryFixture.notFound(testPlaceKeyword);
      const saved = await repository.save(ranking);

      expect(saved.rank).toBeNull();
      expect(saved.searchResultCount).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find ranking history by id', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      const saved = await repository.save(ranking);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.rank).toBe(saved.rank);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all ranking histories with pagination', async () => {
      const rankings = RankingHistoryFixture.createMany(testPlaceKeyword, 3);
      await Promise.all(rankings.map(r => repository.save(r)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should paginate correctly', async () => {
      const rankings = RankingHistoryFixture.createMany(testPlaceKeyword, 5);
      await Promise.all(rankings.map(r => repository.save(r)));

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });

    it('should sort by checkedAt DESC by default', async () => {
      const ranking1 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-01'))
      );
      const ranking2 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-03'))
      );
      const ranking3 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-02'))
      );

      const result = await repository.findAll();

      expect(result.data[0].id).toBe(ranking2.id); // 2024-01-03 (most recent)
      expect(result.data[1].id).toBe(ranking3.id); // 2024-01-02
      expect(result.data[2].id).toBe(ranking1.id); // 2024-01-01
    });

    it('should load placeKeyword relations', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      await repository.save(ranking);

      const result = await repository.findAll();

      expect(result.data[0].placeKeyword).toBeDefined();
      expect(result.data[0].placeKeyword.id).toBe(testPlaceKeyword.id);
    });

    it('should return empty array when no rankings exist', async () => {
      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findByPlaceKeywordId', () => {
    it('should find all rankings for a place-keyword', async () => {
      const rankings = RankingHistoryFixture.createMany(testPlaceKeyword, 3);
      await Promise.all(rankings.map(r => repository.save(r)));

      const found = await repository.findByPlaceKeywordId(testPlaceKeyword.id);

      expect(found).toHaveLength(3);
      found.forEach(ranking => {
        expect(ranking.placeKeyword.id).toBe(testPlaceKeyword.id);
      });
    });

    it('should limit results when limit is provided', async () => {
      const rankings = RankingHistoryFixture.createMany(testPlaceKeyword, 5);
      await Promise.all(rankings.map(r => repository.save(r)));

      const found = await repository.findByPlaceKeywordId(testPlaceKeyword.id, 3);

      expect(found).toHaveLength(3);
    });

    it('should order by checkedAt DESC', async () => {
      const ranking1 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-01'))
      );
      const ranking2 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-03'))
      );
      const ranking3 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-02'))
      );

      const found = await repository.findByPlaceKeywordId(testPlaceKeyword.id);

      expect(found[0].id).toBe(ranking2.id); // Most recent
      expect(found[1].id).toBe(ranking3.id);
      expect(found[2].id).toBe(ranking1.id); // Oldest
    });

    it('should return empty array for non-existent place-keyword', async () => {
      const found = await repository.findByPlaceKeywordId('non-existent-id');
      expect(found).toEqual([]);
    });

    it('should load placeKeyword relations', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      await repository.save(ranking);

      const found = await repository.findByPlaceKeywordId(testPlaceKeyword.id);

      expect(found[0].placeKeyword).toBeDefined();
      expect(found[0].placeKeyword.id).toBe(testPlaceKeyword.id);
    });
  });

  describe('findByPlaceKeywordIdInDateRange', () => {
    it('should find rankings within date range', async () => {
      const ranking1 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-01'))
      );
      const ranking2 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-05'))
      );
      const ranking3 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-10'))
      );

      const found = await repository.findByPlaceKeywordIdInDateRange(
        testPlaceKeyword.id,
        new Date('2024-01-03'),
        new Date('2024-01-08')
      );

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(ranking2.id);
    });

    it('should include boundaries in date range', async () => {
      const ranking1 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-01'))
      );
      const ranking2 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-05'))
      );

      const found = await repository.findByPlaceKeywordIdInDateRange(
        testPlaceKeyword.id,
        new Date('2024-01-01'),
        new Date('2024-01-05')
      );

      expect(found).toHaveLength(2);
    });

    it('should return empty array when no rankings in date range', async () => {
      await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-01'))
      );

      const found = await repository.findByPlaceKeywordIdInDateRange(
        testPlaceKeyword.id,
        new Date('2024-02-01'),
        new Date('2024-02-28')
      );

      expect(found).toEqual([]);
    });

    it('should order by checkedAt DESC', async () => {
      const ranking1 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-02'))
      );
      const ranking2 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-05'))
      );
      const ranking3 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-03'))
      );

      const found = await repository.findByPlaceKeywordIdInDateRange(
        testPlaceKeyword.id,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(found[0].id).toBe(ranking2.id); // 2024-01-05
      expect(found[1].id).toBe(ranking3.id); // 2024-01-03
      expect(found[2].id).toBe(ranking1.id); // 2024-01-02
    });

    it('should load placeKeyword relations', async () => {
      await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-05'))
      );

      const found = await repository.findByPlaceKeywordIdInDateRange(
        testPlaceKeyword.id,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(found[0].placeKeyword).toBeDefined();
      expect(found[0].placeKeyword.id).toBe(testPlaceKeyword.id);
    });
  });

  describe('findLatestByPlaceKeywordId', () => {
    it('should find the most recent ranking', async () => {
      const ranking1 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-01'))
      );
      const ranking2 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-05'))
      );
      const ranking3 = await repository.save(
        RankingHistoryFixture.withCheckedAt(testPlaceKeyword, new Date('2024-01-03'))
      );

      const latest = await repository.findLatestByPlaceKeywordId(testPlaceKeyword.id);

      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(ranking2.id);
      expect(latest!.checkedAt).toEqual(new Date('2024-01-05'));
    });

    it('should return null when no rankings exist', async () => {
      const latest = await repository.findLatestByPlaceKeywordId(testPlaceKeyword.id);
      expect(latest).toBeNull();
    });

    it('should return null for non-existent place-keyword', async () => {
      const latest = await repository.findLatestByPlaceKeywordId('non-existent-id');
      expect(latest).toBeNull();
    });

    it('should load placeKeyword relations', async () => {
      await repository.save(RankingHistoryFixture.create(testPlaceKeyword));

      const latest = await repository.findLatestByPlaceKeywordId(testPlaceKeyword.id);

      expect(latest!.placeKeyword).toBeDefined();
      expect(latest!.placeKeyword.id).toBe(testPlaceKeyword.id);
    });
  });

  describe('update', () => {
    it('should update ranking history', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      const saved = await repository.save(ranking);

      const updated = await repository.update(saved.id, {
        rank: 10,
        searchResultCount: 300,
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.rank).toBe(10);
      expect(updated.searchResultCount).toBe(300);
    });

    it('should throw NotFoundError when ranking does not exist', async () => {
      await expect(repository.update('non-existent-id', { rank: 5 }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete ranking history', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      const saved = await repository.save(ranking);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent ranking', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing ranking', async () => {
      const ranking = RankingHistoryFixture.create(testPlaceKeyword);
      const saved = await repository.save(ranking);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent ranking', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of rankings', async () => {
      const rankings = RankingHistoryFixture.createMany(testPlaceKeyword, 3);
      await Promise.all(rankings.map(r => repository.save(r)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no rankings exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple place-keywords separately', async () => {
      // Create another place-keyword
      const anotherPlace = PlaceFixture.create(testUser);
      await dataSource.getRepository(Place).save(anotherPlace);
      const anotherPlaceKeyword = PlaceKeywordFixture.create(anotherPlace, testKeyword);
      await dataSource.getRepository(PlaceKeyword).save(anotherPlaceKeyword);

      // Create rankings for both
      const ranking1 = await repository.save(RankingHistoryFixture.create(testPlaceKeyword));
      const ranking2 = await repository.save(RankingHistoryFixture.create(anotherPlaceKeyword));

      const found1 = await repository.findByPlaceKeywordId(testPlaceKeyword.id);
      const found2 = await repository.findByPlaceKeywordId(anotherPlaceKeyword.id);

      expect(found1).toHaveLength(1);
      expect(found2).toHaveLength(1);
      expect(found1[0].id).toBe(ranking1.id);
      expect(found2[0].id).toBe(ranking2.id);
    });

    it('should handle very high ranks', async () => {
      const ranking = await repository.save(
        RankingHistoryFixture.withRank(testPlaceKeyword, 999)
      );

      const found = await repository.findById(ranking.id);
      expect(found!.rank).toBe(999);
    });

    it('should handle zero search results', async () => {
      const ranking = await repository.save(
        RankingHistoryFixture.create(testPlaceKeyword, { searchResultCount: 0 })
      );

      const found = await repository.findById(ranking.id);
      expect(found!.searchResultCount).toBe(0);
    });
  });
});
