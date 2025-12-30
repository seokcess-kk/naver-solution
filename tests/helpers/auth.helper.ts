import { JwtAuthService } from '@infrastructure/auth/JwtAuthService';
import { User } from '@domain/entities/User';

/**
 * Helper class for authentication-related test utilities
 * Simplifies JWT token generation for tests
 */
export class AuthTestHelper {
  private jwtService: JwtAuthService;

  constructor() {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-testing';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    this.jwtService = new JwtAuthService();
  }

  /**
   * Generate a valid access token for testing
   */
  generateAccessToken(userId: string): string {
    return this.jwtService.generateAccessToken(userId);
  }

  /**
   * Generate a valid refresh token for testing
   */
  generateRefreshToken(userId: string): string {
    return this.jwtService.generateRefreshToken(userId);
  }

  /**
   * Generate Authorization header with Bearer token
   * Useful for API tests
   */
  generateAuthHeader(userId: string): { Authorization: string } {
    const token = this.generateAccessToken(userId);
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Create authenticated user object with tokens
   * Useful for integration tests
   */
  createAuthenticatedUser(user: User): {
    user: User;
    accessToken: string;
    refreshToken: string;
  } {
    return {
      user,
      accessToken: this.generateAccessToken(user.id),
      refreshToken: this.generateRefreshToken(user.id),
    };
  }

  /**
   * Verify an access token (for testing token validation)
   */
  verifyAccessToken(token: string): { userId: string } {
    return this.jwtService.verifyAccessToken(token);
  }

  /**
   * Verify a refresh token (for testing token validation)
   */
  verifyRefreshToken(token: string): { userId: string } {
    return this.jwtService.verifyRefreshToken(token);
  }
}

/**
 * Create a new AuthTestHelper instance
 */
export function createAuthHelper(): AuthTestHelper {
  return new AuthTestHelper();
}
