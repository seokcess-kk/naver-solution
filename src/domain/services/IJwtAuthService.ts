/**
 * Interface for JWT token operations
 * Defines contract for token generation and verification
 */
export interface IJwtAuthService {
  /**
   * Generate an access token
   * @param userId - User ID to encode in token
   * @returns JWT access token
   */
  generateAccessToken(userId: string): string;

  /**
   * Generate a refresh token
   * @param userId - User ID to encode in token
   * @returns JWT refresh token
   */
  generateRefreshToken(userId: string): string;

  /**
   * Verify and decode an access token
   * @param token - JWT access token
   * @returns Decoded payload with userId
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(token: string): { userId: string };

  /**
   * Verify and decode a refresh token
   * @param token - JWT refresh token
   * @returns Decoded payload with userId
   * @throws Error if token is invalid or expired
   */
  verifyRefreshToken(token: string): { userId: string };
}
