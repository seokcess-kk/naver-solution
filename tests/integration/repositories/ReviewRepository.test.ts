import { DataSource } from 'typeorm';
import { ReviewRepository } from '@infrastructure/repositories/ReviewRepository';
import { Review } from '@domain/entities/Review';
import { Place } from '@domain/entities/Place';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { ReviewFixture } from '@tests/fixtures/reviews';
import { PlaceFixture } from '@tests/fixtures/places';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('ReviewRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: ReviewRepository;
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
    repository = new ReviewRepository(dataSource);

    const userRepo = dataSource.getRepository(User);
    testUser = UserFixture.create();
    testUser = await userRepo.save(testUser);

    const placeRepo = dataSource.getRepository(Place);
    testPlace = PlaceFixture.create(testUser);
    testPlace = await placeRepo.save(testPlace);
  });

  describe('save', () => {
    it('should save a new review to database', async () => {
      const review = ReviewFixture.create(testPlace);
      const saved = await repository.save(review);

      expect(saved.id).toBeDefined();
      expect(saved.naverReviewId).toBe(review.naverReviewId);
      expect(saved.content).toBe(review.content);
      expect(saved.rating).toBe(review.rating);
    });

    it('should update existing review', async () => {
      const review = ReviewFixture.create(testPlace);
      const saved = await repository.save(review);

      saved.rating = 5;
      saved.sentiment = 'POSITIVE';
      const updated = await repository.save(saved);

      expect(updated.id).toBe(saved.id);
      expect(updated.rating).toBe(5);
      expect(updated.sentiment).toBe('POSITIVE');
    });

    it('should enforce unique constraint on naverReviewId', async () => {
      const review1 = ReviewFixture.withNaverReviewId(testPlace, 'unique-review-id');
      await repository.save(review1);

      const review2 = ReviewFixture.withNaverReviewId(testPlace, 'unique-review-id');
      await expect(repository.save(review2)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find review by id', async () => {
      const review = ReviewFixture.create(testPlace);
      const saved = await repository.save(review);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.content).toBe(saved.content);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all reviews with pagination', async () => {
      const reviews = ReviewFixture.createMany(testPlace, 3);
      await Promise.all(reviews.map(r => repository.save(r)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should load place relations', async () => {
      const review = ReviewFixture.create(testPlace);
      await repository.save(review);

      const result = await repository.findAll();

      expect(result.data[0].place).toBeDefined();
      expect(result.data[0].place.id).toBe(testPlace.id);
    });
  });

  describe('findByPlaceId', () => {
    it('should find all reviews for a place', async () => {
      const reviews = ReviewFixture.createMany(testPlace, 3);
      await Promise.all(reviews.map(r => repository.save(r)));

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found).toHaveLength(3);
      found.forEach(review => {
        expect(review.place.id).toBe(testPlace.id);
      });
    });

    it('should limit results when limit is provided', async () => {
      const reviews = ReviewFixture.createMany(testPlace, 5);
      await Promise.all(reviews.map(r => repository.save(r)));

      const found = await repository.findByPlaceId(testPlace.id, 3);

      expect(found).toHaveLength(3);
    });

    it('should order by publishedAt DESC', async () => {
      const review1 = await repository.save(
        ReviewFixture.withPublishedAt(testPlace, new Date('2024-01-01'))
      );
      const review2 = await repository.save(
        ReviewFixture.withPublishedAt(testPlace, new Date('2024-01-03'))
      );
      const review3 = await repository.save(
        ReviewFixture.withPublishedAt(testPlace, new Date('2024-01-02'))
      );

      const found = await repository.findByPlaceId(testPlace.id);

      expect(found[0].id).toBe(review2.id);
      expect(found[1].id).toBe(review3.id);
      expect(found[2].id).toBe(review1.id);
    });
  });

  describe('findByNaverReviewId', () => {
    it('should find review by naver review id', async () => {
      const review = ReviewFixture.withNaverReviewId(testPlace, 'test-naver-id');
      await repository.save(review);

      const found = await repository.findByNaverReviewId('test-naver-id');

      expect(found).not.toBeNull();
      expect(found!.naverReviewId).toBe('test-naver-id');
    });

    it('should return null for non-existent naver review id', async () => {
      const found = await repository.findByNaverReviewId('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findBySentiment', () => {
    it('should find positive reviews', async () => {
      await repository.save(ReviewFixture.positive(testPlace));
      await repository.save(ReviewFixture.positive(testPlace));
      await repository.save(ReviewFixture.negative(testPlace));

      const found = await repository.findBySentiment(testPlace.id, 'POSITIVE');

      expect(found).toHaveLength(2);
      found.forEach(review => {
        expect(review.sentiment).toBe('POSITIVE');
      });
    });

    it('should find negative reviews', async () => {
      await repository.save(ReviewFixture.positive(testPlace));
      await repository.save(ReviewFixture.negative(testPlace));

      const found = await repository.findBySentiment(testPlace.id, 'NEGATIVE');

      expect(found).toHaveLength(1);
      expect(found[0].sentiment).toBe('NEGATIVE');
    });

    it('should find neutral reviews', async () => {
      await repository.save(ReviewFixture.neutral(testPlace));
      await repository.save(ReviewFixture.positive(testPlace));

      const found = await repository.findBySentiment(testPlace.id, 'NEUTRAL');

      expect(found).toHaveLength(1);
      expect(found[0].sentiment).toBe('NEUTRAL');
    });

    it('should return empty array when no reviews match sentiment', async () => {
      await repository.save(ReviewFixture.positive(testPlace));

      const found = await repository.findBySentiment(testPlace.id, 'NEGATIVE');

      expect(found).toEqual([]);
    });
  });

  describe('findRecentByPlaceId', () => {
    it('should find reviews from last N days', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      await repository.save(ReviewFixture.withPublishedAt(testPlace, yesterday));
      await repository.save(ReviewFixture.withPublishedAt(testPlace, threeDaysAgo));
      await repository.save(ReviewFixture.withPublishedAt(testPlace, tenDaysAgo));

      const found = await repository.findRecentByPlaceId(testPlace.id, 7);

      expect(found).toHaveLength(2); // yesterday and 3 days ago
    });

    it('should return empty array when no recent reviews', async () => {
      const oldDate = new Date('2023-01-01');
      await repository.save(ReviewFixture.withPublishedAt(testPlace, oldDate));

      const found = await repository.findRecentByPlaceId(testPlace.id, 7);

      expect(found).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update review', async () => {
      const review = ReviewFixture.create(testPlace);
      const saved = await repository.save(review);

      const updated = await repository.update(saved.id, {
        rating: 5,
        sentiment: 'POSITIVE',
      });

      expect(updated.rating).toBe(5);
      expect(updated.sentiment).toBe('POSITIVE');
    });

    it('should throw NotFoundError when review does not exist', async () => {
      await expect(repository.update('non-existent-id', { rating: 5 }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete review', async () => {
      const review = ReviewFixture.create(testPlace);
      const saved = await repository.save(review);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent review', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing review', async () => {
      const review = ReviewFixture.create(testPlace);
      const saved = await repository.save(review);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent review', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of reviews', async () => {
      const reviews = ReviewFixture.createMany(testPlace, 3);
      await Promise.all(reviews.map(r => repository.save(r)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no reviews exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});
