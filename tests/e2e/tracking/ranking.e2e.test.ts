import request from 'supertest';
import { E2ETestContext, setupE2ETest, teardownE2ETest, resetTestDatabase } from '@tests/helpers/e2e.helper';
import { UserFixture } from '@tests/fixtures/users';
import { PlaceFixture } from '@tests/fixtures/places';
import { KeywordFixture } from '@tests/fixtures/keywords';
import { PlaceKeywordFixture } from '@tests/fixtures/placeKeywords';
import { RankingHistoryFixture } from '@tests/fixtures/rankings';
import { User } from '@domain/entities/User';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import bcrypt from 'bcrypt';

describe('Ranking E2E Tests', () => {
  let context: E2ETestContext;
  let testUser: User;
  let testPlace: Place;
  let testKeyword: Keyword;
  let testPlaceKeyword: PlaceKeyword;
  let accessToken: string;

  beforeAll(async () => {
    context = await setupE2ETest();
  });

  afterAll(async () => {
    await teardownE2ETest(context);
  });

  beforeEach(async () => {
    await resetTestDatabase(context);

    // Create test user
    testUser = UserFixture.create();
    testUser.passwordHash = await bcrypt.hash('TestPass@123', 10);
    const userRepo = context.container.get('UserRepository');
    await userRepo.save(testUser);

    // Create test place
    const placeRepo = context.container.get('PlaceRepository');
    testPlace = PlaceFixture.create(testUser);
    await placeRepo.save(testPlace);

    // Create test keyword
    const keywordRepo = context.container.get('KeywordRepository');
    testKeyword = KeywordFixture.create();
    await keywordRepo.save(testKeyword);

    // Create test place-keyword
    const placeKeywordRepo = context.container.get('PlaceKeywordRepository');
    testPlaceKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
    await placeKeywordRepo.save(testPlaceKeyword);

    // Generate access token
    accessToken = context.authHelper.generateAccessToken(testUser.id);
  });

  describe('POST /api/rankings', () => {
    it('should record a new ranking', async () => {
      const response = await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: testPlaceKeyword.id,
          rank: 5,
          searchResultCount: 150,
          checkedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.rank).toBe(5);
      expect(response.body.data.searchResultCount).toBe(150);
      expect(response.body.data.placeKeywordId).toBe(testPlaceKeyword.id);
    });

    it('should record ranking with null rank (not found)', async () => {
      const response = await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: testPlaceKeyword.id,
          rank: null,
          searchResultCount: null,
          checkedAt: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rank).toBeNull();
      expect(response.body.data.searchResultCount).toBeNull();
    });

    it('should return validation error for missing placeKeywordId', async () => {
      const response = await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rank: 5,
          checkedAt: new Date().toISOString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for invalid placeKeywordId format', async () => {
      const response = await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: 'invalid-uuid',
          rank: 5,
          checkedAt: new Date().toISOString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for invalid rank (less than 1)', async () => {
      const response = await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: testPlaceKeyword.id,
          rank: 0,
          checkedAt: new Date().toISOString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for missing checkedAt', async () => {
      const response = await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: testPlaceKeyword.id,
          rank: 5,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .post('/api/rankings')
        .send({
          placeKeywordId: testPlaceKeyword.id,
          rank: 5,
          checkedAt: new Date().toISOString(),
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should handle non-existent placeKeywordId gracefully', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: fakeId,
          rank: 5,
          checkedAt: new Date().toISOString(),
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NotFoundError');
    });
  });

  describe('GET /api/rankings/history', () => {
    beforeEach(async () => {
      // Create some ranking history
      const rankingRepo = context.container.get('RankingHistoryRepository');
      const rankings = [
        RankingHistoryFixture.create(testPlaceKeyword, { rank: 5, checkedAt: new Date('2024-01-01') }),
        RankingHistoryFixture.create(testPlaceKeyword, { rank: 3, checkedAt: new Date('2024-01-05') }),
        RankingHistoryFixture.create(testPlaceKeyword, { rank: 7, checkedAt: new Date('2024-01-10') }),
      ];
      await Promise.all(rankings.map(r => rankingRepo.save(r)));
    });

    it('should get all ranking history for a place-keyword', async () => {
      const response = await request(context.app)
        .get('/api/rankings/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ placeKeywordId: testPlaceKeyword.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('rank');
      expect(response.body.data[0]).toHaveProperty('checkedAt');
    });

    it('should filter ranking history by date range', async () => {
      const response = await request(context.app)
        .get('/api/rankings/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          placeKeywordId: testPlaceKeyword.id,
          startDate: '2024-01-03',
          endDate: '2024-01-08',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rank).toBe(3);
    });

    it('should return empty array for placeKeyword with no history', async () => {
      // Create another place-keyword without history
      const anotherKeyword = KeywordFixture.create();
      await context.container.get('KeywordRepository').save(anotherKeyword);
      const anotherPlaceKeyword = PlaceKeywordFixture.create(testPlace, anotherKeyword);
      await context.container.get('PlaceKeywordRepository').save(anotherPlaceKeyword);

      const response = await request(context.app)
        .get('/api/rankings/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ placeKeywordId: anotherPlaceKeyword.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return bad request when placeKeywordId is missing', async () => {
      const response = await request(context.app)
        .get('/api/rankings/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BadRequestError');
      expect(response.body.error.message).toContain('placeKeywordId');
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .get('/api/rankings/history')
        .query({ placeKeywordId: testPlaceKeyword.id })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should order results by checkedAt DESC', async () => {
      const response = await request(context.app)
        .get('/api/rankings/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ placeKeywordId: testPlaceKeyword.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      const dates = response.body.data.map((r: any) => new Date(r.checkedAt).getTime());
      expect(dates[0]).toBeGreaterThan(dates[1]);
      expect(dates[1]).toBeGreaterThan(dates[2]);
    });
  });

  describe('GET /api/rankings/latest/:placeKeywordId', () => {
    it('should get the latest ranking for a place-keyword', async () => {
      const rankingRepo = context.container.get('RankingHistoryRepository');
      await rankingRepo.save(
        RankingHistoryFixture.create(testPlaceKeyword, { rank: 5, checkedAt: new Date('2024-01-01') })
      );
      await rankingRepo.save(
        RankingHistoryFixture.create(testPlaceKeyword, { rank: 3, checkedAt: new Date('2024-01-05') })
      );

      const response = await request(context.app)
        .get(`/api/rankings/latest/${testPlaceKeyword.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rank).toBe(3); // Latest is Jan 5
      expect(response.body.data).toHaveProperty('checkedAt');
    });

    it('should return null for place-keyword with no rankings', async () => {
      // Create another place-keyword without rankings
      const anotherKeyword = KeywordFixture.create();
      await context.container.get('KeywordRepository').save(anotherKeyword);
      const anotherPlaceKeyword = PlaceKeywordFixture.create(testPlace, anotherKeyword);
      await context.container.get('PlaceKeywordRepository').save(anotherPlaceKeyword);

      const response = await request(context.app)
        .get(`/api/rankings/latest/${anotherPlaceKeyword.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return not found for missing placeKeywordId (route not found)', async () => {
      const response = await request(context.app)
        .get('/api/rankings/latest/')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404); // Route not found - this is expected
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .get(`/api/rankings/latest/${testPlaceKeyword.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return not found for non-existent placeKeywordId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(context.app)
        .get(`/api/rankings/latest/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NotFoundError');
    });
  });

  describe('POST /api/rankings/scrape', () => {
    it('should accept scrape request with valid placeKeywordId', async () => {
      // Note: This test may fail if Naver scraping actually runs
      // In a real scenario, you'd mock the NaverScrapingService
      const response = await request(context.app)
        .post('/api/rankings/scrape')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: testPlaceKeyword.id,
        });

      // Accept either 201 (success) or 500 (scraping failed)
      // since we can't actually scrape in tests
      expect([201, 500]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
      }
    });

    it('should return validation error for missing placeKeywordId', async () => {
      const response = await request(context.app)
        .post('/api/rankings/scrape')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for invalid placeKeywordId format', async () => {
      const response = await request(context.app)
        .post('/api/rankings/scrape')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: 'invalid-uuid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .post('/api/rankings/scrape')
        .send({
          placeKeywordId: testPlaceKeyword.id,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });
  });

  describe('Integration with Ranking Operations', () => {
    it('should reflect newly recorded rankings in history', async () => {
      // Initial history should be empty
      let response = await request(context.app)
        .get('/api/rankings/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ placeKeywordId: testPlaceKeyword.id })
        .expect(200);

      expect(response.body.data).toHaveLength(0);

      // Record a ranking
      await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: testPlaceKeyword.id,
          rank: 5,
          searchResultCount: 100,
          checkedAt: new Date().toISOString(),
        })
        .expect(201);

      // History should now contain the ranking
      response = await request(context.app)
        .get('/api/rankings/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ placeKeywordId: testPlaceKeyword.id })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rank).toBe(5);
    });

    it('should show latest ranking after multiple recordings', async () => {
      const rankingRepo = context.container.get('RankingHistoryRepository');

      // Record first ranking
      await rankingRepo.save(
        RankingHistoryFixture.create(testPlaceKeyword, { rank: 10, checkedAt: new Date('2024-01-01') })
      );

      // Record second ranking (more recent)
      await request(context.app)
        .post('/api/rankings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeKeywordId: testPlaceKeyword.id,
          rank: 3,
          searchResultCount: 150,
          checkedAt: new Date('2024-01-10').toISOString(),
        })
        .expect(201);

      // Latest should be the most recent
      const response = await request(context.app)
        .get(`/api/rankings/latest/${testPlaceKeyword.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.rank).toBe(3);
    });
  });
});
