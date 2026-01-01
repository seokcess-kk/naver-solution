import { DataSource } from 'typeorm';
import { ReviewHistoryRepository } from '@infrastructure/repositories/ReviewHistoryRepository';
import { ReviewHistory } from '@domain/entities/ReviewHistory';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { ReviewHistoryFixture } from '@tests/fixtures/reviewHistories';
import { PlaceFixture } from '@tests/fixtures/places';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('ReviewHistoryRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: ReviewHistoryRepository;
  let testUser: User;
  let testPlace: Place;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new ReviewHistoryRepository(dataSource);

    // Create test dependencies
    const userRepo = dataSource.getRepository(User);
    testUser = UserFixture.create();
    testUser = await userRepo.save(testUser);

    const placeRepo = dataSource.getRepository(Place);
    testPlace = PlaceFixture.create(testUser);
    testPlace = await placeRepo.save(testPlace);
  });

  describe('save', () => {
    it('should save a new review history to database', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      const saved = await repository.save(history);

      expect(saved.id).toBeDefined();
      expect(saved.blogReviewCount).toBe(history.blogReviewCount);
      expect(saved.visitorReviewCount).toBe(history.visitorReviewCount);
      expect(saved.averageRating).toBe(history.averageRating);
      expect(saved.checkedAt).toBeInstanceOf(Date);
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should update existing review history', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      const saved = await repository.save(history);

      saved.blogReviewCount = 100;
      saved.visitorReviewCount = 200;
      saved.averageRating = 4.5;
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.blogReviewCount).toBe(100);
      expect(updated.visitorReviewCount).toBe(200);
      expect(updated.averageRating).toBe(4.5);
    });

    it('should save history with null average rating', async () => {
      const history = ReviewHistoryFixture.noReviews(testPlace);
      const saved = await repository.save(history);

      expect(saved.averageRating).toBeNull();
      expect(saved.blogReviewCount).toBe(0);
      expect(saved.visitorReviewCount).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find review history by id', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      const saved = await repository.save(history);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.blogReviewCount).toBe(saved.blogReviewCount);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all review histories with pagination', async () => {
      const histories = ReviewHistoryFixture.createMany(testPlace, 3);
      await Promise.all(histories.map(h => repository.save(h)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should paginate correctly', async () => {
      const histories = ReviewHistoryFixture.createMany(testPlace, 5);
      await Promise.all(histories.map(h => repository.save(h)));

      const page1 = await repository.findAll({ page: 1, limit: 2 });
      const page2 = await repository.findAll({ page: 2, limit: 2 });

      expect(page1.data).toHaveLength(2);
      expect(page2.data).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(3);
    });

    it('should sort by createdAt DESC by default', async () => {
      const history1 = await repository.save(ReviewHistoryFixture.create(testPlace));
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const history2 = await repository.save(ReviewHistoryFixture.create(testPlace));
      await new Promise(resolve => setTimeout(resolve, 10));
      const history3 = await repository.save(ReviewHistoryFixture.create(testPlace));

      const result = await repository.findAll();

      expect(result.data[0].id).toBe(history3.id); // Most recent
      expect(result.data[1].id).toBe(history2.id);
      expect(result.data[2].id).toBe(history1.id);
    });

    it('should load place relations', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      await repository.save(history);

      const result = await repository.findAll();

      expect(result.data[0].place).toBeDefined();
      expect(result.data[0].place.id).toBe(testPlace.id);
    });

    it('should return empty array when no histories exist', async () => {
      const result = await repository.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findByPlaceId', () => {
    it('should find all histories for a place', async () => {
      const histories = ReviewHistoryFixture.createMany(testPlace, 3);
      await Promise.all(histories.map(h => repository.save(h)));

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found).toHaveLength(3);
      found.forEach(history => {
        expect(history.place.id).toBe(testPlace.id);
      });
    });

    it('should limit results when limit is provided', async () => {
      const histories = ReviewHistoryFixture.createMany(testPlace, 5);
      await Promise.all(histories.map(h => repository.save(h)));

      const found = await repository.findByPlaceId(testPlace.id, 3);

      expect(found).toHaveLength(3);
    });

    it('should order by checkedAt DESC', async () => {
      const history1 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-01'))
      );
      const history2 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-03'))
      );
      const history3 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-02'))
      );

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found[0].id).toBe(history2.id); // Most recent
      expect(found[1].id).toBe(history3.id);
      expect(found[2].id).toBe(history1.id); // Oldest
    });

    it('should return empty array for non-existent place', async () => {
      const found = await repository.findByPlaceId('non-existent-id');
      expect(found).toEqual([]);
    });

    it('should load place relations', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      await repository.save(history);

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found[0].place).toBeDefined();
      expect(found[0].place.id).toBe(testPlace.id);
    });
  });

  describe('findByPlaceIdInDateRange', () => {
    it('should find histories within date range', async () => {
      const history1 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-01'))
      );
      const history2 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-05'))
      );
      const history3 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-10'))
      );

      const found = await repository.findByPlaceIdInDateRange(
        testPlace.id,
        new Date('2024-01-03'),
        new Date('2024-01-08')
      );

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(history2.id);
    });

    it('should include boundaries in date range', async () => {
      const history1 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-01'))
      );
      const history2 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-05'))
      );

      const found = await repository.findByPlaceIdInDateRange(
        testPlace.id,
        new Date('2024-01-01'),
        new Date('2024-01-05')
      );

      expect(found).toHaveLength(2);
    });

    it('should return empty array when no histories in date range', async () => {
      await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-01'))
      );

      const found = await repository.findByPlaceIdInDateRange(
        testPlace.id,
        new Date('2024-02-01'),
        new Date('2024-02-28')
      );

      expect(found).toEqual([]);
    });

    it('should order by checkedAt DESC', async () => {
      const history1 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-02'))
      );
      const history2 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-05'))
      );
      const history3 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-03'))
      );

      const found = await repository.findByPlaceIdInDateRange(
        testPlace.id,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(found[0].id).toBe(history2.id); // 2024-01-05
      expect(found[1].id).toBe(history3.id); // 2024-01-03
      expect(found[2].id).toBe(history1.id); // 2024-01-02
    });

    it('should load place relations', async () => {
      await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-05'))
      );

      const found = await repository.findByPlaceIdInDateRange(
        testPlace.id,
        new Date('2024-01-01'),
        new Date('2024-01-10')
      );

      expect(found[0].place).toBeDefined();
      expect(found[0].place.id).toBe(testPlace.id);
    });
  });

  describe('findLatestByPlaceId', () => {
    it('should find the most recent history', async () => {
      const history1 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-01'))
      );
      const history2 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-05'))
      );
      const history3 = await repository.save(
        ReviewHistoryFixture.withCheckedAt(testPlace, new Date('2024-01-03'))
      );

      const latest = await repository.findLatestByPlaceId(testPlace.id);

      expect(latest).not.toBeNull();
      expect(latest!.id).toBe(history2.id);
      expect(latest!.checkedAt).toEqual(new Date('2024-01-05'));
    });

    it('should return null when no histories exist', async () => {
      const latest = await repository.findLatestByPlaceId(testPlace.id);
      expect(latest).toBeNull();
    });

    it('should return null for non-existent place', async () => {
      const latest = await repository.findLatestByPlaceId('non-existent-id');
      expect(latest).toBeNull();
    });

    it('should load place relations', async () => {
      await repository.save(ReviewHistoryFixture.create(testPlace));

      const latest = await repository.findLatestByPlaceId(testPlace.id);

      expect(latest!.place).toBeDefined();
      expect(latest!.place.id).toBe(testPlace.id);
    });
  });

  describe('update', () => {
    it('should update review history', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      const saved = await repository.save(history);

      const updated = await repository.update(saved.id, {
        blogReviewCount: 150,
        visitorReviewCount: 300,
        averageRating: 4.8,
      });

      expect(updated.id).toBe(saved.id);
      expect(updated.blogReviewCount).toBe(150);
      expect(updated.visitorReviewCount).toBe(300);
      expect(updated.averageRating).toBe(4.8);
    });

    it('should throw NotFoundError when history does not exist', async () => {
      await expect(repository.update('non-existent-id', { blogReviewCount: 50 }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete review history', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      const saved = await repository.save(history);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent history', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing history', async () => {
      const history = ReviewHistoryFixture.create(testPlace);
      const saved = await repository.save(history);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent history', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of histories', async () => {
      const histories = ReviewHistoryFixture.createMany(testPlace, 3);
      await Promise.all(histories.map(h => repository.save(h)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no histories exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple places separately', async () => {
      // Create another place
      const anotherPlace = PlaceFixture.create(testUser);
      await dataSource.getRepository(Place).save(anotherPlace);

      // Create histories for both
      const history1 = await repository.save(ReviewHistoryFixture.create(testPlace));
      const history2 = await repository.save(ReviewHistoryFixture.create(anotherPlace));

      const found1 = await repository.findByPlaceId(testPlace.id);
      const found2 = await repository.findByPlaceId(anotherPlace.id);

      expect(found1).toHaveLength(1);
      expect(found2).toHaveLength(1);
      expect(found1[0].id).toBe(history1.id);
      expect(found2[0].id).toBe(history2.id);
    });

    it('should handle very high review counts', async () => {
      const history = await repository.save(
        ReviewHistoryFixture.withCounts(testPlace, 10000, 20000)
      );

      const found = await repository.findById(history.id);
      expect(found!.blogReviewCount).toBe(10000);
      expect(found!.visitorReviewCount).toBe(20000);
    });

    it('should handle zero review counts', async () => {
      const history = await repository.save(ReviewHistoryFixture.noReviews(testPlace));

      const found = await repository.findById(history.id);
      expect(found!.blogReviewCount).toBe(0);
      expect(found!.visitorReviewCount).toBe(0);
    });

    it('should handle rating edge values', async () => {
      const history1 = await repository.save(
        ReviewHistoryFixture.withRating(testPlace, 1.0)
      );
      const history2 = await repository.save(
        ReviewHistoryFixture.withRating(testPlace, 5.0)
      );

      const found1 = await repository.findById(history1.id);
      const found2 = await repository.findById(history2.id);

      expect(found1!.averageRating).toBe(1.0);
      expect(found2!.averageRating).toBe(5.0);
    });
  });
});
