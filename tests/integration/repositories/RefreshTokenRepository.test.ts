import { DataSource } from 'typeorm';
import { RefreshTokenRepository } from '@infrastructure/repositories/RefreshTokenRepository';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { User } from '@domain/entities/User';
import { createTestDataSource, closeTestDataSource, resetDatabase } from '@tests/helpers/database.helper';
import { RefreshTokenFixture } from '@tests/fixtures/refreshTokens';
import { UserFixture } from '@tests/fixtures/users';
import { NotFoundError } from '@application/errors/HttpError';

describe('RefreshTokenRepository Integration Tests', () => {
  let dataSource: DataSource;
  let repository: RefreshTokenRepository;
  let testUser: User;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
  });

  afterAll(async () => {
    await closeTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
    repository = new RefreshTokenRepository(dataSource);

    // Create and save a test user for token creation
    const userRepo = dataSource.getRepository(User);
    testUser = UserFixture.create();
    testUser = await userRepo.save(testUser);
  });

  describe('save', () => {
    it('should save a new refresh token to database', async () => {
      const token = RefreshTokenFixture.create(testUser);
      const saved = await repository.save(token);

      expect(saved.id).toBeDefined();
      expect(saved.token).toBe(token.token);
      expect(saved.user.id).toBe(testUser.id);
      expect(saved.isRevoked).toBe(false);
      expect(saved.expiresAt).toBeDefined();
    });

    it('should enforce unique constraint on token', async () => {
      const token1 = RefreshTokenFixture.withToken(testUser, 'unique-token-123');
      await repository.save(token1);

      const token2 = RefreshTokenFixture.withToken(testUser, 'unique-token-123');
      await expect(repository.save(token2)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find refresh token by id', async () => {
      const token = RefreshTokenFixture.create(testUser);
      const saved = await repository.save(token);

      const found = await repository.findById(saved.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.token).toBe(saved.token);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('should find refresh token by token string', async () => {
      const token = RefreshTokenFixture.withToken(testUser, 'test-token-abc123');
      const saved = await repository.save(token);

      const found = await repository.findByToken('test-token-abc123');

      expect(found).not.toBeNull();
      expect(found!.id).toBe(saved.id);
      expect(found!.token).toBe('test-token-abc123');
      expect(found!.user).toBeDefined(); // Relation loaded
    });

    it('should return null for non-existent token', async () => {
      const found = await repository.findByToken('non-existent-token');
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all refresh tokens for a user', async () => {
      const tokens = RefreshTokenFixture.createMany(testUser, 3);
      await Promise.all(tokens.map(t => repository.save(t)));

      const found = await repository.findByUserId(testUser.id);

      expect(found).toHaveLength(3);
      found.forEach(token => {
        expect(token.user.id).toBe(testUser.id);
      });
    });

    it('should return empty array for user with no tokens', async () => {
      const found = await repository.findByUserId(testUser.id);
      expect(found).toHaveLength(0);
    });

    it('should return tokens for specific user only', async () => {
      // Create another user
      const userRepo = dataSource.getRepository(User);
      const otherUser = await userRepo.save(UserFixture.create());

      // Create tokens for both users
      await repository.save(RefreshTokenFixture.create(testUser));
      await repository.save(RefreshTokenFixture.create(otherUser));

      const found = await repository.findByUserId(testUser.id);

      expect(found).toHaveLength(1);
      expect(found[0].user.id).toBe(testUser.id);
    });

    it('should include revoked tokens', async () => {
      await repository.save(RefreshTokenFixture.create(testUser));
      await repository.save(RefreshTokenFixture.revoked(testUser));

      const found = await repository.findByUserId(testUser.id);

      expect(found).toHaveLength(2);
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token by id', async () => {
      const token = RefreshTokenFixture.create(testUser);
      const saved = await repository.save(token);

      await repository.revokeToken(saved.id);

      const revoked = await repository.findById(saved.id);
      expect(revoked!.isRevoked).toBe(true);
      expect(revoked!.revokedAt).not.toBeNull();
    });

    it('should update revokedAt timestamp', async () => {
      const token = RefreshTokenFixture.create(testUser);
      const saved = await repository.save(token);

      const beforeRevoke = new Date();
      await repository.revokeToken(saved.id);

      const revoked = await repository.findById(saved.id);
      expect(revoked!.revokedAt!.getTime()).toBeGreaterThanOrEqual(beforeRevoke.getTime());
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all non-revoked tokens for a user', async () => {
      const tokens = RefreshTokenFixture.createMany(testUser, 3);
      await Promise.all(tokens.map(t => repository.save(t)));

      await repository.revokeAllUserTokens(testUser.id);

      const allTokens = await repository.findByUserId(testUser.id);
      allTokens.forEach(token => {
        expect(token.isRevoked).toBe(true);
        expect(token.revokedAt).not.toBeNull();
      });
    });

    it('should not revoke already revoked tokens', async () => {
      const activeToken = RefreshTokenFixture.create(testUser);
      const revokedToken = RefreshTokenFixture.revoked(testUser);
      const revokedDate = revokedToken.revokedAt;

      await repository.save(activeToken);
      await repository.save(revokedToken);

      await repository.revokeAllUserTokens(testUser.id);

      const found = await repository.findById(revokedToken.id);
      // Original revokedAt should remain the same
      expect(found!.revokedAt).toEqual(revokedDate);
    });

    it('should not affect other users tokens', async () => {
      // Create another user
      const userRepo = dataSource.getRepository(User);
      const otherUser = await userRepo.save(UserFixture.create());

      const testUserToken = await repository.save(RefreshTokenFixture.create(testUser));
      const otherUserToken = await repository.save(RefreshTokenFixture.create(otherUser));

      await repository.revokeAllUserTokens(testUser.id);

      const testUserUpdated = await repository.findById(testUserToken.id);
      const otherUserUpdated = await repository.findById(otherUserToken.id);

      expect(testUserUpdated!.isRevoked).toBe(true);
      expect(otherUserUpdated!.isRevoked).toBe(false);
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete all expired tokens', async () => {
      const activeToken = RefreshTokenFixture.create(testUser);
      const expiredToken1 = RefreshTokenFixture.expired(testUser);
      const expiredToken2 = RefreshTokenFixture.expired(testUser);

      await repository.save(activeToken);
      const saved1 = await repository.save(expiredToken1);
      const saved2 = await repository.save(expiredToken2);

      await repository.deleteExpiredTokens();

      const activeFound = await repository.findById(activeToken.id);
      const expired1Found = await repository.findById(saved1.id);
      const expired2Found = await repository.findById(saved2.id);

      expect(activeFound).not.toBeNull();
      expect(expired1Found).toBeNull();
      expect(expired2Found).toBeNull();
    });

    it('should not delete non-expired tokens', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      const token = RefreshTokenFixture.withExpiration(testUser, futureDate);
      const saved = await repository.save(token);

      await repository.deleteExpiredTokens();

      const found = await repository.findById(saved.id);
      expect(found).not.toBeNull();
    });

    it('should delete revoked expired tokens', async () => {
      const token = RefreshTokenFixture.expired(testUser);
      token.isRevoked = true;
      token.revokedAt = new Date();
      const saved = await repository.save(token);

      await repository.deleteExpiredTokens();

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update token fields', async () => {
      const token = RefreshTokenFixture.create(testUser);
      const saved = await repository.save(token);

      const newExpiration = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const updated = await repository.update(saved.id, {
        expiresAt: newExpiration,
        deviceInfo: 'Updated Device',
      });

      expect(updated.expiresAt).toEqual(newExpiration);
      expect(updated.deviceInfo).toBe('Updated Device');
    });

    it('should throw NotFoundError when token does not exist', async () => {
      await expect(repository.update('non-existent-id', { deviceInfo: 'New' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete refresh token', async () => {
      const token = RefreshTokenFixture.create(testUser);
      const saved = await repository.save(token);

      await repository.delete(saved.id);

      const found = await repository.findById(saved.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError when deleting non-existent token', async () => {
      await expect(repository.delete('non-existent-id'))
        .rejects
        .toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true for existing token', async () => {
      const token = RefreshTokenFixture.create(testUser);
      const saved = await repository.save(token);

      const exists = await repository.exists(saved.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent token', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count of tokens', async () => {
      const tokens = RefreshTokenFixture.createMany(testUser, 3);
      await Promise.all(tokens.map(t => repository.save(t)));

      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should return 0 when no tokens exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return all tokens with pagination', async () => {
      const tokens = RefreshTokenFixture.createMany(testUser, 3);
      await Promise.all(tokens.map(t => repository.save(t)));

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should include user relations', async () => {
      const token = RefreshTokenFixture.create(testUser);
      await repository.save(token);

      const result = await repository.findAll();

      expect(result.data[0].user).toBeDefined();
      expect(result.data[0].user.id).toBe(testUser.id);
    });
  });
});
