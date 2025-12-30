import jwt from 'jsonwebtoken';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Service for generating and verifying JWT tokens
 */
export class JwtAuthService implements IJwtAuthService {
  private readonly secret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || '';
    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  /**
   * Generate an access token
   * @param userId - User ID to encode in token
   * @returns JWT access token
   */
  generateAccessToken(userId: string): string {
    const payload = {
      userId,
      type: 'access' as const,
    };
    return jwt.sign(payload, this.secret, { expiresIn: this.accessExpiresIn } as jwt.SignOptions);
  }

  /**
   * Generate a refresh token
   * @param userId - User ID to encode in token
   * @returns JWT refresh token
   */
  generateRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh' as const,
      jti: `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`, // Unique token ID
    };
    return jwt.sign(payload, this.secret, { expiresIn: this.refreshExpiresIn } as jwt.SignOptions);
  }

  /**
   * Verify and decode an access token
   * @param token - JWT access token
   * @returns Decoded payload with userId
   * @throws Error if token is invalid or expired
   */
  verifyAccessToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify and decode a refresh token
   * @param token - JWT refresh token
   * @returns Decoded payload with userId
   * @throws Error if token is invalid or expired
   */
  verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }
}
