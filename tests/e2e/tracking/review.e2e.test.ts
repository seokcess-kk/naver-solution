import request from 'supertest';
import { E2ETestContext, setupE2ETest, teardownE2ETest, resetTestDatabase } from '@tests/helpers/e2e.helper';
import { UserFixture } from '@tests/fixtures/users';
import { PlaceFixture } from '@tests/fixtures/places';
import { ReviewFixture } from '@tests/fixtures/reviews';
import { User } from '@domain/entities/User';
import { Place } from '@domain/entities/Place';
import bcrypt from 'bcrypt';

describe('Review E2E Tests', () => {
  let context: E2ETestContext;
  let testUser: User;
  let testPlace: Place;
  let accessToken: string;

  beforeAll(async () => {
    context = await setupE2ETest();
  });

  afterAll(async () => {
    await teardownE2ETest(context);
  });

  beforeEach(async () => {
    await resetTestDatabase(context);

    testUser = UserFixture.create();
    testUser.passwordHash = await bcrypt.hash('TestPass@123', 10);
    await context.container.get('UserRepository').save(testUser);

    testPlace = PlaceFixture.create(testUser);
    await context.container.get('PlaceRepository').save(testPlace);

    accessToken = context.authHelper.generateAccessToken(testUser.id);
  });

  describe('POST /api/reviews', () => {
    it('should record a new review', async () => {
      const response = await request(context.app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          reviewType: 'BLOG',
          naverReviewId: 'naver-review-123',
          content: '맛있어요!',
          rating: 5,
          author: '홍길동',
          publishedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('맛있어요!');
      expect(response.body.data.rating).toBe(5);
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(context.app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ placeId: testPlace.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .post('/api/reviews')
        .send({
          placeId: testPlace.id,
          naverReviewId: 'naver-review-123',
          content: 'Test',
          rating: 5,
          authorName: 'Test',
          publishedAt: new Date().toISOString(),
        })
        .expect(401);
    });
  });

  describe('GET /api/reviews/place/:placeId', () => {
    beforeEach(async () => {
      const reviewRepo = context.container.get('ReviewRepository');
      const reviews = [
        ReviewFixture.create(testPlace, { rating: 5 }),
        ReviewFixture.create(testPlace, { rating: 4 }),
        ReviewFixture.create(testPlace, { rating: 3 }),
      ];
      await Promise.all(reviews.map(r => reviewRepo.save(r)));
    });

    it('should get all reviews for a place', async () => {
      const response = await request(context.app)
        .get(`/api/reviews/place/${testPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('rating');
    });

    it('should return empty array for place with no reviews', async () => {
      const anotherPlace = PlaceFixture.create(testUser);
      await context.container.get('PlaceRepository').save(anotherPlace);

      const response = await request(context.app)
        .get(`/api/reviews/place/${anotherPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .get(`/api/reviews/place/${testPlace.id}`)
        .expect(401);
    });
  });

  describe('GET /api/reviews/place/:placeId/sentiment/:sentiment', () => {
    beforeEach(async () => {
      const reviewRepo = context.container.get('ReviewRepository');
      await reviewRepo.save(ReviewFixture.positive(testPlace));
      await reviewRepo.save(ReviewFixture.positive(testPlace));
      await reviewRepo.save(ReviewFixture.negative(testPlace));
    });

    it('should get positive reviews', async () => {
      const response = await request(context.app)
        .get(`/api/reviews/place/${testPlace.id}/sentiment/POSITIVE`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((review: any) => {
        expect(review.sentiment).toBe('POSITIVE');
      });
    });

    it('should get negative reviews', async () => {
      const response = await request(context.app)
        .get(`/api/reviews/place/${testPlace.id}/sentiment/NEGATIVE`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].sentiment).toBe('NEGATIVE');
    });

    it('should return empty array for sentiment with no matches', async () => {
      const response = await request(context.app)
        .get(`/api/reviews/place/${testPlace.id}/sentiment/NEUTRAL`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .get(`/api/reviews/place/${testPlace.id}/sentiment/POSITIVE`)
        .expect(401);
    });
  });
});
