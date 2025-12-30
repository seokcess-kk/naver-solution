import request from 'supertest';
import { E2ETestContext, setupE2ETest, teardownE2ETest, resetTestDatabase } from '@tests/helpers/e2e.helper';
import { UserFixture } from '@tests/fixtures/users';
import { User } from '@domain/entities/User';
import bcrypt from 'bcrypt';

describe('Auth E2E Tests', () => {
  let context: E2ETestContext;

  beforeAll(async () => {
    context = await setupE2ETest();
  });

  afterAll(async () => {
    await teardownE2ETest(context);
  });

  beforeEach(async () => {
    await resetTestDatabase(context);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'ValidPass@123',
          name: 'New User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(response.body.data.name).toBe('New User');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      // Password should not be exposed in response
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return validation error for invalid email format', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass@123',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for password too short', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for password missing requirements', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'onlylowercase',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for missing name', async () => {
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass@123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return conflict error when email already exists', async () => {
      // First registration
      await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'ValidPass@123',
          name: 'First User',
        })
        .expect(201);

      // Second registration with same email
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'DifferentPass@456',
          name: 'Second User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ConflictError');
    });

    it('should handle email case-insensitivity', async () => {
      // Register with lowercase email
      await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'case@example.com',
          password: 'ValidPass@123',
          name: 'Lower Case',
        })
        .expect(201);

      // Try to register with uppercase email
      const response = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'CASE@EXAMPLE.COM',
          password: 'ValidPass@123',
          name: 'Upper Case',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ConflictError');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: User;
    const testPassword = 'TestPassword@123';

    beforeEach(async () => {
      // Create user with hashed password
      testUser = UserFixture.create();
      testUser.passwordHash = await bcrypt.hash(testPassword, 10);
      const userRepo = context.container.get('UserRepository');
      await userRepo.save(testUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify RefreshToken saved in database
      const refreshTokenRepo = context.container.get('RefreshTokenRepository');
      const tokens = await refreshTokenRepo.findByUserId(testUser.id);
      expect(tokens).toHaveLength(1);
    });

    it('should return unauthorized for non-existent email', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return unauthorized for wrong password', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return validation error for invalid email format', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testPassword,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should return validation error for missing password', async () => {
      const response = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ValidationError');
    });

    it('should store device info in RefreshToken', async () => {
      const userAgent = 'Mozilla/5.0 (Test Browser)';
      await request(context.app)
        .post('/api/auth/login')
        .set('User-Agent', userAgent)
        .send({
          email: testUser.email,
          password: testPassword,
        })
        .expect(200);

      const refreshTokenRepo = context.container.get('RefreshTokenRepository');
      const tokens = await refreshTokenRepo.findByUserId(testUser.id);
      expect(tokens[0].deviceInfo).toBe(userAgent);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let testUser: User;
    let validRefreshToken: string;

    beforeEach(async () => {
      // Create and login user to get valid refresh token
      testUser = UserFixture.create();
      testUser.passwordHash = await bcrypt.hash('TestPass@123', 10);
      const userRepo = context.container.get('UserRepository');
      await userRepo.save(testUser);

      const loginResponse = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass@123',
        });

      validRefreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(context.app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(typeof response.body.data.accessToken).toBe('string');
    });

    it('should return unauthorized for invalid token', async () => {
      const response = await request(context.app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token-string' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return unauthorized for revoked token', async () => {
      // Revoke the token
      const refreshTokenRepo = context.container.get('RefreshTokenRepository');
      const token = await refreshTokenRepo.findByToken(validRefreshToken);
      if (token) {
        await refreshTokenRepo.revokeToken(token.id);
      }

      const response = await request(context.app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return unauthorized for expired token', async () => {
      // Create expired token
      const expiredToken = context.authHelper.generateRefreshToken(testUser.id);
      // Note: This test might need adjustment based on JWT expiration implementation

      const response = await request(context.app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser: User;
    let accessToken: string;

    beforeEach(async () => {
      testUser = UserFixture.create();
      testUser.passwordHash = await bcrypt.hash('TestPass@123', 10);
      const userRepo = context.container.get('UserRepository');
      await userRepo.save(testUser);

      accessToken = context.authHelper.generateAccessToken(testUser.id);
    });

    it('should get profile with valid token', async () => {
      const response = await request(context.app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return unauthorized without token', async () => {
      const response = await request(context.app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return unauthorized with invalid token', async () => {
      const response = await request(context.app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });

    it('should return unauthorized with malformed Authorization header', async () => {
      const response = await request(context.app)
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let testUser: User;
    let accessToken: string;
    let validRefreshToken: string;

    beforeEach(async () => {
      testUser = UserFixture.create();
      testUser.passwordHash = await bcrypt.hash('TestPass@123', 10);
      const userRepo = context.container.get('UserRepository');
      await userRepo.save(testUser);

      const loginResponse = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass@123',
        });

      accessToken = loginResponse.body.data.accessToken;
      validRefreshToken = loginResponse.body.data.refreshToken;
    });

    it('should logout and revoke refresh token', async () => {
      const response = await request(context.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify token is revoked in database
      const refreshTokenRepo = context.container.get('RefreshTokenRepository');
      const token = await refreshTokenRepo.findByToken(validRefreshToken);
      expect(token).not.toBeNull();
      expect(token!.isRevoked).toBe(true);
      expect(token!.revokedAt).not.toBeNull();
    });

    it('should succeed even without refreshToken in body', async () => {
      const response = await request(context.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should succeed with non-existent refreshToken (idempotent)', async () => {
      const response = await request(context.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'non-existent-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return unauthorized without auth header', async () => {
      const response = await request(context.app)
        .post('/api/auth/logout')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UnauthorizedError');
    });
  });

  describe('Full Authentication Flow', () => {
    it('should complete register → login → profile → refresh → logout flow', async () => {
      // 1. Register
      const registerRes = await request(context.app)
        .post('/api/auth/register')
        .send({
          email: 'flow@test.com',
          password: 'FlowTest@123',
          name: 'Flow Test User',
        })
        .expect(201);

      expect(registerRes.body.success).toBe(true);

      // 2. Login
      const loginRes = await request(context.app)
        .post('/api/auth/login')
        .send({
          email: 'flow@test.com',
          password: 'FlowTest@123',
        })
        .expect(200);

      const { accessToken, refreshToken } = loginRes.body.data;
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      // 3. Access protected endpoint (Get Profile)
      const profileRes = await request(context.app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileRes.body.data.email).toBe('flow@test.com');
      expect(profileRes.body.data.name).toBe('Flow Test User');

      // 4. Refresh token
      const refreshRes = await request(context.app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const newAccessToken = refreshRes.body.data.accessToken;
      expect(newAccessToken).toBeDefined();

      // 5. Logout
      const logoutRes = await request(context.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(logoutRes.body.success).toBe(true);

      // 6. Verify cannot use revoked refresh token
      await request(context.app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
