import { LogoutUseCase } from '@application/usecases/auth/LogoutUseCase';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { User } from '@domain/entities/User';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  beforeEach(() => {
    mockRefreshTokenRepository = MockFactory.createRefreshTokenRepository();
    useCase = new LogoutUseCase(mockRefreshTokenRepository);
  });

  describe('execute', () => {
    const refreshToken = 'refresh-token-123';
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

    const mockTokenEntity: RefreshToken = {
      id: 'token-id-123',
      user: mockUser,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
      deviceInfo: null,
      createdAt: new Date(),
      revokedAt: null,
    };

    describe('Happy Path', () => {
      beforeEach(() => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockTokenEntity);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);
      });

      it('should successfully logout by revoking refresh token', async () => {
        await useCase.execute(refreshToken);

        expect(mockRefreshTokenRepository.revokeToken).toHaveBeenCalledWith(mockTokenEntity.id);
      });

      it('should find refresh token in database', async () => {
        await useCase.execute(refreshToken);

        expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(refreshToken);
      });

      it('should not throw error on successful logout', async () => {
        await expect(useCase.execute(refreshToken)).resolves.not.toThrow();
      });

      it('should return void', async () => {
        const result = await useCase.execute(refreshToken);

        expect(result).toBeUndefined();
      });
    });

    describe('Idempotent Behavior', () => {
      it('should not throw error when token does not exist', async () => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

        await expect(useCase.execute(refreshToken)).resolves.not.toThrow();
      });

      it('should not call revokeToken when token does not exist', async () => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

        await useCase.execute(refreshToken);

        expect(mockRefreshTokenRepository.revokeToken).not.toHaveBeenCalled();
      });

      it('should not throw error when token is already revoked', async () => {
        const revokedToken = { ...mockTokenEntity, isRevoked: true };
        mockRefreshTokenRepository.findByToken.mockResolvedValue(revokedToken);

        await expect(useCase.execute(refreshToken)).resolves.not.toThrow();
      });

      it('should not call revokeToken when token is already revoked', async () => {
        const revokedToken = { ...mockTokenEntity, isRevoked: true };
        mockRefreshTokenRepository.findByToken.mockResolvedValue(revokedToken);

        await useCase.execute(refreshToken);

        expect(mockRefreshTokenRepository.revokeToken).not.toHaveBeenCalled();
      });

      it('should be safe to call multiple times with same token', async () => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockTokenEntity);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);

        await useCase.execute(refreshToken);
        await useCase.execute(refreshToken);

        // Should try to revoke both times (if token is found)
        expect(mockRefreshTokenRepository.revokeToken).toHaveBeenCalledTimes(2);
      });
    });

    describe('Error Cases', () => {
      it('should propagate repository errors when finding token', async () => {
        const error = new Error('Database connection failed');
        mockRefreshTokenRepository.findByToken.mockRejectedValue(error);

        await expect(useCase.execute(refreshToken)).rejects.toThrow(error);
      });

      it('should propagate repository errors when revoking token', async () => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockTokenEntity);
        const error = new Error('Failed to revoke token');
        mockRefreshTokenRepository.revokeToken.mockRejectedValue(error);

        await expect(useCase.execute(refreshToken)).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockTokenEntity);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);
      });

      it('should handle empty refresh token string', async () => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(null);

        await expect(useCase.execute('')).resolves.not.toThrow();
      });

      it('should handle very long refresh token', async () => {
        const longToken = 'A'.repeat(1000);
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockTokenEntity);

        await useCase.execute(longToken);

        expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(longToken);
      });

      it('should handle token with special characters', async () => {
        const specialToken = 'token-with-!@#$%^&*()_+{}[]|\\:";\'<>?,./';
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockTokenEntity);

        await useCase.execute(specialToken);

        expect(mockRefreshTokenRepository.findByToken).toHaveBeenCalledWith(specialToken);
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockRefreshTokenRepository.findByToken.mockResolvedValue(mockTokenEntity);
        mockRefreshTokenRepository.revokeToken.mockResolvedValue(undefined);
      });

      it('should find token before revoking it', async () => {
        await useCase.execute(refreshToken);

        const findCall = mockRefreshTokenRepository.findByToken.mock.invocationCallOrder[0];
        const revokeCall = mockRefreshTokenRepository.revokeToken.mock.invocationCallOrder[0];

        expect(findCall).toBeLessThan(revokeCall);
      });
    });
  });
});
