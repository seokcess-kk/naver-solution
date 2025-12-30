import { JwtAuthService } from '@infrastructure/auth/JwtAuthService';
import jwt from 'jsonwebtoken';

describe('JwtAuthService', () => {
  let service: JwtAuthService;
  const originalEnv = process.env;

  beforeEach(() => {
    // Set test environment variables
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret-key-minimum-32-characters-long-for-testing',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
    service = new JwtAuthService();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should throw error when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;
      expect(() => new JwtAuthService()).toThrow('JWT_SECRET environment variable is required');
    });

    it('should use default expiration times when not set', () => {
      delete process.env.JWT_ACCESS_EXPIRES_IN;
      delete process.env.JWT_REFRESH_EXPIRES_IN;
      process.env.JWT_SECRET = 'test-secret';

      expect(() => new JwtAuthService()).not.toThrow();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const userId = 'user-123';
      const token = service.generateAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('access');
    });

    it('should generate different tokens for different users', () => {
      const token1 = service.generateAccessToken('user-1');
      const token2 = service.generateAccessToken('user-2');

      expect(token1).not.toBe(token2);
    });

    it('should include expiration time', () => {
      const userId = 'user-123';
      const token = service.generateAccessToken(userId);

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = 'user-123';
      const token = service.generateRefreshToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(userId);
      expect(decoded.type).toBe('refresh');
    });

    it('should generate different tokens for different users', () => {
      const token1 = service.generateRefreshToken('user-1');
      const token2 = service.generateRefreshToken('user-2');

      expect(token1).not.toBe(token2);
    });

    it('should have longer expiration than access token', () => {
      const userId = 'user-123';
      const accessToken = service.generateAccessToken(userId);
      const refreshToken = service.generateRefreshToken(userId);

      const accessDecoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
      const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const userId = 'user-123';
      const token = service.generateAccessToken(userId);

      const result = service.verifyAccessToken(token);

      expect(result.userId).toBe(userId);
    });

    it('should throw error for expired token', () => {
      const userId = 'user-123';
      const expiredToken = jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' } // Already expired
      );

      expect(() => service.verifyAccessToken(expiredToken)).toThrow('Token expired');
    });

    it('should throw error for invalid token', () => {
      expect(() => service.verifyAccessToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for wrong secret', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId, type: 'access' }, 'wrong-secret');

      expect(() => service.verifyAccessToken(token)).toThrow('Invalid token');
    });

    it('should throw error when token type is refresh', () => {
      const userId = 'user-123';
      const refreshToken = service.generateRefreshToken(userId);

      expect(() => service.verifyAccessToken(refreshToken)).toThrow('Invalid token type');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const userId = 'user-123';
      const token = service.generateRefreshToken(userId);

      const result = service.verifyRefreshToken(token);

      expect(result.userId).toBe(userId);
    });

    it('should throw error for expired token', () => {
      const userId = 'user-123';
      const expiredToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' }
      );

      expect(() => service.verifyRefreshToken(expiredToken)).toThrow('Token expired');
    });

    it('should throw error for invalid token', () => {
      expect(() => service.verifyRefreshToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error when token type is access', () => {
      const userId = 'user-123';
      const accessToken = service.generateAccessToken(userId);

      expect(() => service.verifyRefreshToken(accessToken)).toThrow('Invalid token type');
    });
  });
});
