import request from 'supertest';
import { E2ETestContext, setupE2ETest, teardownE2ETest, resetTestDatabase } from '@tests/helpers/e2e.helper';
import { UserFixture } from '@tests/fixtures/users';
import { PlaceFixture } from '@tests/fixtures/places';
import { User } from '@domain/entities/User';
import { Place } from '@domain/entities/Place';
import bcrypt from 'bcrypt';

describe('Place Stats E2E Tests', () => {
  let context: E2ETestContext;
  let testUser: User;
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

    // Generate access token
    accessToken = context.authHelper.generateAccessToken(testUser.id);
  });

  describe('GET /api/places/stats', () => {
    it('should return place statistics for user', async () => {
      // Create test places
      const placeRepo = context.container.get('PlaceRepository');
      const activePlaces = PlaceFixture.createMany(testUser, 3, { isActive: true });
      const inactivePlaces = PlaceFixture.createMany(testUser, 2, { isActive: false });

      await Promise.all([...activePlaces, ...inactivePlaces].map(p => placeRepo.save(p)));

      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalPlaces: 5,
        activePlaces: 3,
        inactivePlaces: 2,
      });
    });

    it('should return zero stats for user with no places', async () => {
      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalPlaces: 0,
        activePlaces: 0,
        inactivePlaces: 0,
      });
    });

    it('should return stats with all active places', async () => {
      const placeRepo = context.container.get('PlaceRepository');
      const places = PlaceFixture.createMany(testUser, 4, { isActive: true });
      await Promise.all(places.map(p => placeRepo.save(p)));

      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalPlaces: 4,
        activePlaces: 4,
        inactivePlaces: 0,
      });
    });

    it('should return stats with all inactive places', async () => {
      const placeRepo = context.container.get('PlaceRepository');
      const places = PlaceFixture.createMany(testUser, 3, { isActive: false });
      await Promise.all(places.map(p => placeRepo.save(p)));

      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalPlaces: 3,
        activePlaces: 0,
        inactivePlaces: 3,
      });
    });

    it('should only count places for specified user', async () => {
      // Create another user with places
      const otherUser = UserFixture.create();
      otherUser.passwordHash = await bcrypt.hash('OtherPass@123', 10);
      const userRepo = context.container.get('UserRepository');
      await userRepo.save(otherUser);

      const placeRepo = context.container.get('PlaceRepository');

      // Create places for test user
      const testUserPlaces = PlaceFixture.createMany(testUser, 2, { isActive: true });
      await Promise.all(testUserPlaces.map(p => placeRepo.save(p)));

      // Create places for other user
      const otherUserPlaces = PlaceFixture.createMany(otherUser, 5, { isActive: true });
      await Promise.all(otherUserPlaces.map(p => placeRepo.save(p)));

      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalPlaces: 2,
        activePlaces: 2,
        inactivePlaces: 0,
      });
    });

    it('should calculate inactivePlaces correctly', async () => {
      const placeRepo = context.container.get('PlaceRepository');
      const activePlaces = PlaceFixture.createMany(testUser, 7, { isActive: true });
      const inactivePlaces = PlaceFixture.createMany(testUser, 3, { isActive: false });

      await Promise.all([...activePlaces, ...inactivePlaces].map(p => placeRepo.save(p)));

      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      const { totalPlaces, activePlaces: active, inactivePlaces: inactive } = response.body.data;
      expect(inactive).toBe(totalPlaces - active);
      expect(totalPlaces).toBe(active + inactive);
    });

    it('should return bad request when userId is missing', async () => {
      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BadRequestError');
      expect(response.body.error.message).toContain('userId');
    });

    it('should return bad request when userId is empty string', async () => {
      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BadRequestError');
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .get('/api/places/stats')
        .query({ userId: testUser.id })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return unauthorized with invalid token', async () => {
      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', 'Bearer invalid-token')
        .query({ userId: testUser.id })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should handle non-existent userId gracefully', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: fakeUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalPlaces: 0,
        activePlaces: 0,
        inactivePlaces: 0,
      });
    });

    it('should return correct response structure', async () => {
      const response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalPlaces');
      expect(response.body.data).toHaveProperty('activePlaces');
      expect(response.body.data).toHaveProperty('inactivePlaces');
      expect(typeof response.body.data.totalPlaces).toBe('number');
      expect(typeof response.body.data.activePlaces).toBe('number');
      expect(typeof response.body.data.inactivePlaces).toBe('number');
    });
  });

  describe('Integration with Place Operations', () => {
    it('should reflect newly created places in stats', async () => {
      // Initial stats
      let response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.data.totalPlaces).toBe(0);

      // Create a place
      const placeRepo = context.container.get('PlaceRepository');
      const newPlace = PlaceFixture.create(testUser);
      await placeRepo.save(newPlace);

      // Updated stats
      response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.data.totalPlaces).toBe(1);
      expect(response.body.data.activePlaces).toBe(1);
    });

    it('should reflect place active status changes in stats', async () => {
      const placeRepo = context.container.get('PlaceRepository');
      const place = PlaceFixture.create(testUser, { isActive: true });
      await placeRepo.save(place);

      // Initial stats - 1 active
      let response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.data.activePlaces).toBe(1);
      expect(response.body.data.inactivePlaces).toBe(0);

      // Deactivate place
      await placeRepo.update(place.id, { isActive: false });

      // Updated stats - 0 active, 1 inactive
      response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.data.activePlaces).toBe(0);
      expect(response.body.data.inactivePlaces).toBe(1);
    });

    it('should reflect deleted places in stats', async () => {
      const placeRepo = context.container.get('PlaceRepository');
      const place = PlaceFixture.create(testUser);
      await placeRepo.save(place);

      // Initial stats - 1 place
      let response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.data.totalPlaces).toBe(1);

      // Delete place
      await placeRepo.delete(place.id);

      // Updated stats - 0 places
      response = await request(context.app)
        .get('/api/places/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body.data.totalPlaces).toBe(0);
    });
  });
});
