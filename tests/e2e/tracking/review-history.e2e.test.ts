import request from 'supertest';
import { E2ETestContext, setupE2ETest, teardownE2ETest, resetTestDatabase } from '@tests/helpers/e2e.helper';
import { UserFixture } from '@tests/fixtures/users';
import { PlaceFixture } from '@tests/fixtures/places';
import { ReviewHistoryFixture } from '@tests/fixtures/reviewHistories';
import { User } from '@domain/entities/User';
import { Place } from '@domain/entities/Place';
import bcrypt from 'bcrypt';

describe('ReviewHistory E2E Tests', () => {
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

  describe('POST /api/review-history', () => {
    it('should record review history', async () => {
      const response = await request(context.app)
        .post('/api/review-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          blogReviewCount: 50,
          visitorReviewCount: 100,
          averageRating: 4.5,
          checkedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.blogReviewCount).toBe(50);
      expect(response.body.data.visitorReviewCount).toBe(100);
      expect(response.body.data.averageRating).toBe(4.5);
    });

    it('should return validation error for missing fields', async () => {
      await request(context.app)
        .post('/api/review-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ placeId: testPlace.id })
        .expect(400);
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .post('/api/review-history')
        .send({
          placeId: testPlace.id,
          blogReviewCount: 50,
          visitorReviewCount: 100,
          checkedAt: new Date().toISOString(),
        })
        .expect(401);
    });
  });

  describe('GET /api/review-history/place/:placeId', () => {
    beforeEach(async () => {
      const historyRepo = context.container.get('ReviewHistoryRepository');
      const histories = [
        ReviewHistoryFixture.create(testPlace, { blogReviewCount: 10, checkedAt: new Date('2024-01-01') }),
        ReviewHistoryFixture.create(testPlace, { blogReviewCount: 20, checkedAt: new Date('2024-01-05') }),
        ReviewHistoryFixture.create(testPlace, { blogReviewCount: 30, checkedAt: new Date('2024-01-10') }),
      ];
      await Promise.all(histories.map(h => historyRepo.save(h)));
    });

    it('should get review history for a place', async () => {
      const response = await request(context.app)
        .get(`/api/review-history/place/${testPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('blogReviewCount');
    });

    it('should filter by date range', async () => {
      const response = await request(context.app)
        .get(`/api/review-history/place/${testPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2024-01-03', endDate: '2024-01-08' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .get(`/api/review-history/place/${testPlace.id}`)
        .expect(401);
    });
  });

  describe('GET /api/review-history/place/:placeId/latest', () => {
    it('should get latest review stats', async () => {
      const historyRepo = context.container.get('ReviewHistoryRepository');
      await historyRepo.save(
        ReviewHistoryFixture.create(testPlace, { blogReviewCount: 10, checkedAt: new Date('2024-01-01') })
      );
      await historyRepo.save(
        ReviewHistoryFixture.create(testPlace, { blogReviewCount: 20, checkedAt: new Date('2024-01-05') })
      );

      const response = await request(context.app)
        .get(`/api/review-history/place/${testPlace.id}/latest`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.blogReviewCount).toBe(20);
    });

    it('should return null when no history exists', async () => {
      const response = await request(context.app)
        .get(`/api/review-history/place/${testPlace.id}/latest`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .get(`/api/review-history/place/${testPlace.id}/latest`)
        .expect(401);
    });
  });
});
