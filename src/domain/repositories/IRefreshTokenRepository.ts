import { RefreshToken } from '@domain/entities/RefreshToken';
import { IBaseRepository } from './IBaseRepository';

/**
 * RefreshToken Repository Interface
 * Extends IBaseRepository with RefreshToken-specific query methods
 */
export interface IRefreshTokenRepository extends IBaseRepository<RefreshToken> {
  /**
   * Find a refresh token by token string
   * @param token - Hashed token string
   * @returns RefreshToken or null if not found
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Find all refresh tokens for a user
   * @param userId - User ID
   * @returns Array of RefreshTokens
   */
  findByUserId(userId: string): Promise<RefreshToken[]>;

  /**
   * Revoke a refresh token by ID
   * @param id - RefreshToken ID
   */
  revokeToken(id: string): Promise<void>;

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User ID
   */
  revokeAllUserTokens(userId: string): Promise<void>;

  /**
   * Delete all expired refresh tokens (batch cleanup)
   */
  deleteExpiredTokens(): Promise<void>;
}
