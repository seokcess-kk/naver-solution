import request from 'supertest';
import { E2ETestContext, setupE2ETest, teardownE2ETest, resetTestDatabase } from '@tests/helpers/e2e.helper';
import { UserFixture } from '@tests/fixtures/users';
import { PlaceFixture } from '@tests/fixtures/places';
import { CompetitorFixture, CompetitorSnapshotFixture } from '@tests/fixtures/competitors';
import { User } from '@domain/entities/User';
import { Place } from '@domain/entities/Place';
import { Competitor } from '@domain/entities/Competitor';
import bcrypt from 'bcrypt';

describe('Competitor E2E Tests', () => {
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

  describe('POST /api/competitors', () => {
    it('should add a new competitor', async () => {
      const response = await request(context.app)
        .post('/api/competitors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          competitorNaverPlaceId: 'comp-naver-123',
          competitorName: '경쟁업체',
          category: '음식점',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.competitorName).toBe('경쟁업체');
      expect(response.body.data.category).toBe('음식점');
    });

    it('should return validation error for missing fields', async () => {
      await request(context.app)
        .post('/api/competitors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ placeId: testPlace.id })
        .expect(400);
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .post('/api/competitors')
        .send({
          placeId: testPlace.id,
          competitorNaverPlaceId: 'comp-naver-123',
          competitorName: '경쟁업체',
          category: '음식점',
        })
        .expect(401);
    });
  });

  describe('POST /api/competitors/snapshots', () => {
    let testCompetitor: Competitor;

    beforeEach(async () => {
      testCompetitor = CompetitorFixture.create(testPlace);
      await context.container.get('CompetitorRepository').save(testCompetitor);
    });

    it('should record competitor snapshot', async () => {
      const response = await request(context.app)
        .post('/api/competitors/snapshots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          competitorId: testCompetitor.id,
          rank: 3,
          blogReviewCount: 50,
          visitorReviewCount: 100,
          averageRating: 4.5,
          checkedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.rank).toBe(3);
      expect(response.body.data.blogReviewCount).toBe(50);
    });

    it('should return validation error for missing fields', async () => {
      await request(context.app)
        .post('/api/competitors/snapshots')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ competitorId: testCompetitor.id })
        .expect(400);
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .post('/api/competitors/snapshots')
        .send({
          competitorId: testCompetitor.id,
          rank: 3,
          blogReviewCount: 50,
          visitorReviewCount: 100,
          averageRating: 4.5,
          checkedAt: new Date().toISOString(),
        })
        .expect(401);
    });
  });

  describe('GET /api/competitors/:competitorId/history', () => {
    let testCompetitor: Competitor;

    beforeEach(async () => {
      testCompetitor = CompetitorFixture.create(testPlace);
      await context.container.get('CompetitorRepository').save(testCompetitor);

      const snapshotRepo = context.container.get('CompetitorSnapshotRepository');
      const snapshots = [
        CompetitorSnapshotFixture.create(testCompetitor, { rank: 5, checkedAt: new Date('2024-01-01') }),
        CompetitorSnapshotFixture.create(testCompetitor, { rank: 3, checkedAt: new Date('2024-01-05') }),
        CompetitorSnapshotFixture.create(testCompetitor, { rank: 7, checkedAt: new Date('2024-01-10') }),
      ];
      await Promise.all(snapshots.map(s => snapshotRepo.save(s)));
    });

    it('should get competitor history', async () => {
      const response = await request(context.app)
        .get(`/api/competitors/${testCompetitor.id}/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('rank');
    });

    it('should filter by date range', async () => {
      const response = await request(context.app)
        .get(`/api/competitors/${testCompetitor.id}/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ startDate: '2024-01-03', endDate: '2024-01-08' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rank).toBe(3);
    });

    it('should return empty array when no history exists', async () => {
      const anotherCompetitor = CompetitorFixture.create(testPlace);
      await context.container.get('CompetitorRepository').save(anotherCompetitor);

      const response = await request(context.app)
        .get(`/api/competitors/${anotherCompetitor.id}/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return unauthorized without token', async () => {
      await request(context.app)
        .get(`/api/competitors/${testCompetitor.id}/history`)
        .expect(401);
    });
  });
});
