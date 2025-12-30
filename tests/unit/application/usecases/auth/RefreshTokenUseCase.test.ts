import { RefreshTokenUseCase } from '@application/usecases/auth/RefreshTokenUseCase';
import { RefreshTokenRequestDto } from '@application/dtos/auth/RefreshTokenRequestDto';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { User } from '@domain/entities/User';
import { UnauthorizedError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let mockJwtAuthService: jest.Mocked<IJwtAuthService>;

  beforeEach(() => {
    mockRefreshTokenRepository = MockFactory.createRefreshTokenRepository();
    mockJwtAuthService = MockFactory.createJwtAuthService();

    useCase = new RefreshTokenUseCase(mockRefreshTokenRepository, mockJwtAuthService);
  });

  describe('execute', () => {
    const validDto: RefreshTokenRequestDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockUser: User = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      places: [],
      notificationSettings: [],
      refreshTokens: [],
    };

    const mockRefreshToken: RefreshToken = {
      id: 'token-123',
      user: mockUser,
      token: 'valid-refresh-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isRevoked: false,
      deviceInfo: 'Chrome on Windows',
      createdAt: new Date(),
      revokedAt: null,
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockRefreshToken);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);
        mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);
        mockJwtAuthService.generateAccessToken.mockReturnValue('new-access-token');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('new-refresh-token');
      });

      it('should successfully refresh tokens with valid refresh token', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.accessToken).toBe('new-access-token');
        expect(result.refreshToken).toBe('new-refresh-token');
      });

      it('should verify refresh token JWT signature', async () => {
        await useCase.execute(validDto);

        expect(mockJwtAuthService.verifyRefreshToken).toHaveBeenCalledWith(validDto.refreshToken);
      });

      it('should find refresh token in database', async () => {
        await useCase.execute(validDto);

        expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(
          validDto.refreshToken
        );
      });

      it('should revoke old refresh token', async () => {
        await useCase.execute(validDto);

        expect(mockRefreshTokenRepository.revokeToken).toHaveBeenCalledWith(mockRefreshToken.id);
      });

      it('should save new refresh token with correct properties', async () => {
        await useCase.execute(validDto);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            user: mockUser,
            token: 'new-refresh-token',
            deviceInfo: mockRefreshToken.deviceInfo,
          })
        );
      });

      it('should set new refresh token expiration to 7 days from now', async () => {
        const beforeExecution = new Date();
        beforeExecution.setDate(beforeExecution.getDate() + 7);

        await useCase.execute(validDto);

        const savedToken = mockRefreshTokenRepository.save.mock.calls[0][0];
        const expiresAt = savedToken.expiresAt;

        // Allow 1 second tolerance for test execution time
        const timeDiff = Math.abs(expiresAt.getTime() - beforeExecution.getTime());
        expect(timeDiff).toBeLessThan(1000);
      });

      it('should generate new access and refresh tokens', async () => {
        await useCase.execute(validDto);

        expect(mockJwtAuthService.generateAccessToken).toHaveBeenCalledWith('user-123');
        expect(mockJwtAuthService.generateRefreshToken).toHaveBeenCalledWith('user-123');
      });
    });

    describe('Error Cases', () => {
      it('should throw UnauthorizedError when JWT verification fails', async () => {
        mockJwtAuthService.verifyRefreshToken.mockImplementation(() => {
          throw new Error('Invalid token');
        });

        await expect(useCase.execute(validDto)).rejects.toThrow(UnauthorizedError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Invalid or expired refresh token'
        );
      });

      it('should throw UnauthorizedError when token not found in database', async () => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(UnauthorizedError);
        await expect(useCase.execute(validDto)).rejects.toThrow('Invalid refresh token');
      });

      it('should throw UnauthorizedError when token is revoked', async () => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        const revokedToken = { ...mockRefreshToken, isRevoked: true };
        mockRefreshTokenRepository.findByToken.mockResolvedValue(revokedToken);

        await expect(useCase.execute(validDto)).rejects.toThrow(UnauthorizedError);
        await expect(useCase.execute(validDto)).rejects.toThrow(
          'Refresh token has been revoked'
        );
      });

      it('should throw UnauthorizedError when token is expired', async () => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        const expiredToken = {
          ...mockRefreshToken,
          expiresAt: new Date(Date.now() - 1000), // 1 second ago
        };
        mockRefreshTokenRepository.findByToken.mockResolvedValue(expiredToken);

        await expect(useCase.execute(validDto)).rejects.toThrow(UnauthorizedError);
        await expect(useCase.execute(validDto)).rejects.toThrow('Refresh token has expired');
      });

      it('should propagate repository errors when finding token', async () => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        const error = new Error('Database connection failed');
        mockRefreshTokenRepository.findByToken.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when revoking token', async () => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockRefreshToken);
        const error = new Error('Failed to revoke token');
        mockRefreshTokenRepository.revokeToken.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate repository errors when saving new token', async () => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockRefreshToken);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);
        mockJwtAuthService.generateAccessToken.mockReturnValue('new-access-token');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('new-refresh-token');

        const error = new Error('Failed to save new token');
        mockRefreshTokenRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Token Rotation', () => {
      beforeEach(() => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockRefreshToken);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);
        mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);
        mockJwtAuthService.generateAccessToken.mockReturnValue('new-access-token');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('new-refresh-token');
      });

      it('should revoke old token before saving new token', async () => {
        await useCase.execute(validDto);

        const revokeCall = mockRefreshTokenRepository.revokeToken.mock.invocationCallOrder[0];
        const saveCall = mockRefreshTokenRepository.save.mock.invocationCallOrder[0];

        expect(revokeCall).toBeLessThan(saveCall);
      });

      it('should generate tokens after finding and validating refresh token', async () => {
        await useCase.execute(validDto);

        const findCall = mockRefreshTokenRepository.findByToken.mock.invocationCallOrder[0];
        const accessTokenCall = mockJwtAuthService.generateAccessToken.mock.invocationCallOrder[0];
        const refreshTokenCall =
          mockJwtAuthService.generateRefreshToken.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(accessTokenCall);
        expect(findCall).toBeLessThan(refreshTokenCall);
      });

      it('should not generate new tokens if validation fails', async () => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockJwtAuthService.generateAccessToken).not.toHaveBeenCalled();
        expect(mockJwtAuthService.generateRefreshToken).not.toHaveBeenCalled();
      });

      it('should not save new token if old token revocation fails', async () => {
        const error = new Error('Failed to revoke');
        mockRefreshTokenRepository.revokeToken.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);

        expect(mockRefreshTokenRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockJwtAuthService.verifyRefreshToken.mockReturnValue({ userId: 'user-123' });
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockRefreshToken);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);
        mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);
        mockJwtAuthService.generateAccessToken.mockReturnValue('new-access-token');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('new-refresh-token');
      });

      it('should handle token expiring exactly now', async () => {
        const expiringNowToken = {
          ...mockRefreshToken,
          expiresAt: new Date(Date.now() - 1), // Expired 1ms ago
        };
        mockRefreshTokenRepository.findByToken.mockResolvedValue(expiringNowToken);

        // Token expired in the past should be considered expired
        await expect(useCase.execute(validDto)).rejects.toThrow('Refresh token has expired');
      });

      it('should handle token with null device info', async () => {
        const tokenWithNullDevice = {
          ...mockRefreshToken,
          deviceInfo: null,
        };
        mockRefreshTokenRepository.findByToken.mockResolvedValue(tokenWithNullDevice);

        await useCase.execute(validDto);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceInfo: null,
          })
        );
      });

      it('should preserve original device info in new token', async () => {
        const deviceInfo = 'Safari on iPhone';
        const tokenWithDevice = {
          ...mockRefreshToken,
          deviceInfo: deviceInfo,
        };
        mockRefreshTokenRepository.findByToken.mockResolvedValue(tokenWithDevice);

        await useCase.execute(validDto);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceInfo: deviceInfo,
          })
        );
      });
    });
  });
});
