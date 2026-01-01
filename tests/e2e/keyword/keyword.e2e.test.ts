import request from 'supertest';
import { E2ETestContext, setupE2ETest, teardownE2ETest, resetTestDatabase } from '@tests/helpers/e2e.helper';
import { UserFixture } from '@tests/fixtures/users';
import { PlaceFixture } from '@tests/fixtures/places';
import { KeywordFixture } from '@tests/fixtures/keywords';
import { PlaceKeywordFixture } from '@tests/fixtures/placeKeywords';
import { User } from '@domain/entities/User';
import { Place } from '@domain/entities/Place';
import { Keyword } from '@domain/entities/Keyword';
import { PlaceKeyword } from '@domain/entities/PlaceKeyword';
import bcrypt from 'bcrypt';

describe('Keyword E2E Tests', () => {
  let context: E2ETestContext;
  let testUser: User;
  let accessToken: string;
  let testPlace: Place;
  let testKeyword: Keyword;

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

    // Generate access token
    accessToken = context.authHelper.generateAccessToken(testUser.id);

    // Create test place
    testPlace = PlaceFixture.create(testUser);
    const placeRepo = context.container.get('PlaceRepository');
    await placeRepo.save(testPlace);

    // Create test keyword
    testKeyword = KeywordFixture.withKeyword('강남 맛집');
    const keywordRepo = context.container.get('KeywordRepository');
    await keywordRepo.save(testKeyword);
  });

  describe('GET /api/keywords', () => {
    it('should list all keywords with pagination', async () => {
      // Create multiple keywords
      const keyword1 = await context.container.get('KeywordRepository').save(KeywordFixture.withKeyword('서울 카페'));
      const keyword2 = await context.container.get('KeywordRepository').save(KeywordFixture.withKeyword('부산 맛집'));

      const response = await request(context.app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBeGreaterThanOrEqual(3); // testKeyword + 2 new ones
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('should support pagination parameters', async () => {
      // Create 5 keywords
      for (let i = 1; i <= 5; i++) {
        await context.container.get('KeywordRepository').save(KeywordFixture.withKeyword(`키워드 ${i}`));
      }

      const response = await request(context.app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.data.data.length).toBe(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
    });

    it('should return empty array when no keywords exist', async () => {
      // Clear existing testKeyword
      await context.container.get('KeywordRepository').delete(testKeyword.id);

      const response = await request(context.app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .get('/api/keywords')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return unauthorized with invalid token', async () => {
      const response = await request(context.app)
        .get('/api/keywords')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });
  });

  describe('GET /api/keywords/place/:placeId', () => {
    let placeKeyword: PlaceKeyword;

    beforeEach(async () => {
      // Add keyword to place
      placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      await context.container.get('PlaceKeywordRepository').save(placeKeyword);
    });

    it('should get keywords for a specific place', async () => {
      const response = await request(context.app)
        .get(`/api/keywords/place/${testPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toMatchObject({
        id: placeKeyword.id,
        keyword: expect.any(String),
        region: placeKeyword.region,
        isActive: placeKeyword.isActive,
      });
    });

    it('should return empty array when place has no keywords', async () => {
      // Create new place without keywords
      const newPlace = PlaceFixture.create(testUser);
      await context.container.get('PlaceRepository').save(newPlace);

      const response = await request(context.app)
        .get(`/api/keywords/place/${newPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return not found for non-existent place', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(context.app)
        .get(`/api/keywords/place/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NotFoundError');
    });

    it('should return validation error for invalid placeId format', async () => {
      const response = await request(context.app)
        .get('/api/keywords/place/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .get(`/api/keywords/place/${testPlace.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });
  });

  describe('POST /api/keywords/place', () => {
    it('should add a keyword to a place', async () => {
      const newKeywordText = '신촌 맛집';

      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          keyword: newKeywordText,
          region: '서울',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        keyword: newKeywordText,
        region: '서울',
        isActive: true,
      });

      // Verify keyword was created or found
      const keywordRepo = context.container.get('KeywordRepository');
      const keyword = await keywordRepo.findByKeyword(newKeywordText);
      expect(keyword).not.toBeNull();
      expect(keyword!.keyword).toBe(newKeywordText);

      // Verify PlaceKeyword relation was created
      const placeKeywordRepo = context.container.get('PlaceKeywordRepository');
      const placeKeywords = await placeKeywordRepo.findByPlaceId(testPlace.id);
      expect(placeKeywords.length).toBe(1);
      expect(placeKeywords[0].keyword.keyword).toBe(newKeywordText);
    });

    it('should add keyword without region (optional)', async () => {
      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          keyword: '홍대 카페',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.keyword).toBe('홍대 카페');
      expect(response.body.data.region).toBeNull(); // No region defaults to null
    });

    it('should reuse existing keyword when adding to different place', async () => {
      const existingKeyword = testKeyword.keyword; // '강남 맛집'

      // Create another place
      const anotherPlace = PlaceFixture.create(testUser);
      await context.container.get('PlaceRepository').save(anotherPlace);

      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: anotherPlace.id,
          keyword: existingKeyword,
          region: '강남구',
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify only one keyword entity exists
      const keywordRepo = context.container.get('KeywordRepository');
      const count = await keywordRepo.count();
      expect(count).toBe(1); // Only testKeyword should exist
    });

    it('should return conflict error when adding duplicate keyword to same place', async () => {
      // First add
      await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          keyword: '중복 키워드',
          region: '강남구',
        })
        .expect(201);

      // Second add - same place, keyword, region
      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          keyword: '중복 키워드',
          region: '강남구',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ConflictError');
    });

    it('should return validation error for missing placeId', async () => {
      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          keyword: '테스트',
          region: '서울',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for missing keyword', async () => {
      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          region: '서울',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for invalid placeId format', async () => {
      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: 'not-a-uuid',
          keyword: '테스트',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for keyword exceeding max length', async () => {
      const longKeyword = 'a'.repeat(101); // Max is 100

      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          keyword: longKeyword,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return not found for non-existent place', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: fakeId,
          keyword: '테스트 키워드',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NotFoundError');
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .post('/api/keywords/place')
        .send({
          placeId: testPlace.id,
          keyword: '테스트',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });
  });

  describe('DELETE /api/keywords/place/:placeKeywordId', () => {
    let placeKeyword: PlaceKeyword;

    beforeEach(async () => {
      // Add keyword to place
      placeKeyword = PlaceKeywordFixture.create(testPlace, testKeyword);
      await context.container.get('PlaceKeywordRepository').save(placeKeyword);
    });

    it('should remove a keyword from a place', async () => {
      const response = await request(context.app)
        .delete(`/api/keywords/place/${placeKeyword.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify PlaceKeyword was deleted
      const placeKeywordRepo = context.container.get('PlaceKeywordRepository');
      const deleted = await placeKeywordRepo.findById(placeKeyword.id);
      expect(deleted).toBeNull();

      // Verify Keyword entity still exists (not cascade deleted)
      const keywordRepo = context.container.get('KeywordRepository');
      const keyword = await keywordRepo.findById(testKeyword.id);
      expect(keyword).not.toBeNull();
    });

    it('should return not found for non-existent placeKeywordId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(context.app)
        .delete(`/api/keywords/place/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NotFoundError');
    });

    it('should return validation error for invalid placeKeywordId format', async () => {
      const response = await request(context.app)
        .delete('/api/keywords/place/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .delete(`/api/keywords/place/${placeKeyword.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should be idempotent when deleting already deleted keyword', async () => {
      // First delete
      await request(context.app)
        .delete(`/api/keywords/place/${placeKeyword.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Second delete - should return 404
      const response = await request(context.app)
        .delete(`/api/keywords/place/${placeKeyword.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NotFoundError');
    });
  });

  describe('Keyword Management Flow', () => {
    it('should complete add → list → get by place → remove flow', async () => {
      // 1. Add keyword to place
      const addRes = await request(context.app)
        .post('/api/keywords/place')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          placeId: testPlace.id,
          keyword: 'E2E 테스트 키워드',
          region: '강남구',
        })
        .expect(201);

      const placeKeywordId = addRes.body.data.id;
      expect(addRes.body.success).toBe(true);

      // 2. List all keywords
      const listRes = await request(context.app)
        .get('/api/keywords')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listRes.body.data.data.length).toBeGreaterThanOrEqual(2); // testKeyword + new one

      // 3. Get keywords for the place
      const getPlaceKeywordsRes = await request(context.app)
        .get(`/api/keywords/place/${testPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getPlaceKeywordsRes.body.data.length).toBe(1);
      expect(getPlaceKeywordsRes.body.data[0].keyword).toBe('E2E 테스트 키워드');
      expect(getPlaceKeywordsRes.body.data[0].region).toBe('강남구');

      // 4. Remove keyword from place
      const removeRes = await request(context.app)
        .delete(`/api/keywords/place/${placeKeywordId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(removeRes.body.success).toBe(true);

      // 5. Verify keyword removed from place
      const verifyRes = await request(context.app)
        .get(`/api/keywords/place/${testPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(verifyRes.body.data).toEqual([]);
    });

    it('should handle multiple keywords for same place', async () => {
      const keywords = ['키워드1', '키워드2', '키워드3'];

      // Add multiple keywords
      for (const keyword of keywords) {
        await request(context.app)
          .post('/api/keywords/place')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            placeId: testPlace.id,
            keyword,
            region: '서울',
          })
          .expect(201);
      }

      // Get all keywords for place
      const response = await request(context.app)
        .get(`/api/keywords/place/${testPlace.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(3);
      const returnedKeywords = response.body.data.map((pk: any) => pk.keyword);
      expect(returnedKeywords).toEqual(expect.arrayContaining(keywords));
    });
  });
});
