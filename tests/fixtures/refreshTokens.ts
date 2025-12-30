import { RefreshToken } from '@domain/entities/RefreshToken';
import { User } from '@domain/entities/User';
import { randomUUID } from 'crypto';

/**
 * Fixture factory for creating RefreshToken test data
 */
export class RefreshTokenFixture {
  private static counter = 0;

  /**
   * Create a single refresh token with optional overrides
   */
  static create(user: User, overrides?: Partial<RefreshToken>): RefreshToken {
    this.counter++;
    const refreshToken = new RefreshToken();
    refreshToken.id = randomUUID();
    refreshToken.user = user;
    refreshToken.token = `refresh_token_${this.counter}_${randomUUID()}`;
    refreshToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    refreshToken.isRevoked = false;
    refreshToken.deviceInfo = `Test Device ${this.counter}`;
    refreshToken.createdAt = new Date();
    refreshToken.revokedAt = null;

    return Object.assign(refreshToken, overrides);
  }

  /**
   * Create multiple refresh tokens for a user
   */
  static createMany(user: User, count: number, overrides?: Partial<RefreshToken>): RefreshToken[] {
    return Array.from({ length: count }, () => this.create(user, overrides));
  }

  /**
   * Create an expired refresh token
   */
  static expired(user: User): RefreshToken {
    return this.create(user, {
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
    });
  }

  /**
   * Create a revoked refresh token
   */
  static revoked(user: User): RefreshToken {
    return this.create(user, {
      isRevoked: true,
      revokedAt: new Date(),
    });
  }

  /**
   * Create a refresh token with specific token string
   */
  static withToken(user: User, token: string): RefreshToken {
    return this.create(user, { token });
  }

  /**
   * Create a refresh token with specific expiration
   */
  static withExpiration(user: User, expiresAt: Date): RefreshToken {
    return this.create(user, { expiresAt });
  }

  /**
   * Create a refresh token with specific device info
   */
  static withDevice(user: User, deviceInfo: string): RefreshToken {
    return this.create(user, { deviceInfo });
  }
}
