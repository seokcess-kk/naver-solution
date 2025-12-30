import { LoginUseCase } from '@application/usecases/auth/LoginUseCase';
import { LoginRequestDto } from '@application/dtos/auth/LoginRequestDto';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '@domain/repositories/IRefreshTokenRepository';
import { IPasswordHashService } from '@domain/services/IPasswordHashService';
import { IJwtAuthService } from '@domain/services/IJwtAuthService';
import { User } from '@domain/entities/User';
import { RefreshToken } from '@domain/entities/RefreshToken';
import { UnauthorizedError } from '@application/errors/HttpError';
import { MockFactory } from '@tests/helpers/mock.helper';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHashService: jest.Mocked<IPasswordHashService>;
  let mockJwtAuthService: jest.Mocked<IJwtAuthService>;
  let mockRefreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;

  beforeEach(() => {
    mockUserRepository = MockFactory.createUserRepository();
    mockPasswordHashService = MockFactory.createPasswordHashService();
    mockJwtAuthService = MockFactory.createJwtAuthService();
    mockRefreshTokenRepository = MockFactory.createRefreshTokenRepository();

    useCase = new LoginUseCase(
      mockUserRepository,
      mockPasswordHashService,
      mockJwtAuthService,
      mockRefreshTokenRepository
    );
  });

  describe('execute', () => {
    const validDto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'password123',
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

    describe('Happy Path', () => {
      beforeEach(() => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordHashService.compare.mockResolvedValue(true);
        mockJwtAuthService.generateAccessToken.mockReturnValue('access-token-123');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('refresh-token-123');
        mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);
      });

      it('should successfully login with valid credentials', async () => {
        const result = await useCase.execute(validDto);

        expect(result).toBeDefined();
        expect(result.accessToken).toBe('access-token-123');
        expect(result.refreshToken).toBe('refresh-token-123');
        expect(result.user).toEqual({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        });
      });

      it('should not return password hash in response', async () => {
        const result = await useCase.execute(validDto);

        expect(result.user).not.toHaveProperty('passwordHash');
        expect(result).not.toHaveProperty('passwordHash');
      });

      it('should generate both access and refresh tokens', async () => {
        await useCase.execute(validDto);

        expect(mockJwtAuthService.generateAccessToken).toHaveBeenCalledWith(mockUser.id);
        expect(mockJwtAuthService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      });

      it('should save refresh token to database', async () => {
        await useCase.execute(validDto);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            user: mockUser,
            token: 'refresh-token-123',
            deviceInfo: null,
          })
        );
      });

      it('should save refresh token with device info when provided', async () => {
        const deviceInfo = 'Chrome on Windows';
        await useCase.execute(validDto, deviceInfo);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceInfo: deviceInfo,
          })
        );
      });

      it('should set refresh token expiration to 7 days from now', async () => {
        const beforeExecution = new Date();
        beforeExecution.setDate(beforeExecution.getDate() + 7);

        await useCase.execute(validDto);

        const savedToken = mockRefreshTokenRepository.save.mock.calls[0][0];
        const expiresAt = savedToken.expiresAt;

        // Allow 1 second tolerance for test execution time
        const timeDiff = Math.abs(expiresAt.getTime() - beforeExecution.getTime());
        expect(timeDiff).toBeLessThan(1000);
      });
    });

    describe('Error Cases', () => {
      it('should throw UnauthorizedError when user does not exist', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow(UnauthorizedError);
        await expect(useCase.execute(validDto)).rejects.toThrow('Invalid email or password');
      });

      it('should throw UnauthorizedError when password is incorrect', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordHashService.compare.mockResolvedValue(false);

        await expect(useCase.execute(validDto)).rejects.toThrow(UnauthorizedError);
        await expect(useCase.execute(validDto)).rejects.toThrow('Invalid email or password');
      });

      it('should propagate repository errors', async () => {
        const error = new Error('Database connection failed');
        mockUserRepository.findByEmail.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate password comparison errors', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        const error = new Error('Password comparison failed');
        mockPasswordHashService.compare.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });

      it('should propagate refresh token save errors', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordHashService.compare.mockResolvedValue(true);
        mockJwtAuthService.generateAccessToken.mockReturnValue('access-token');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('refresh-token');

        const error = new Error('Failed to save refresh token');
        mockRefreshTokenRepository.save.mockRejectedValue(error);

        await expect(useCase.execute(validDto)).rejects.toThrow(error);
      });
    });

    describe('Boundary Conditions', () => {
      beforeEach(() => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordHashService.compare.mockResolvedValue(true);
        mockJwtAuthService.generateAccessToken.mockReturnValue('access-token');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('refresh-token');
        mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);
      });

      it('should handle email with different cases', async () => {
        const dtoWithUpperCase = {
          ...validDto,
          email: 'TEST@EXAMPLE.COM',
        };

        await useCase.execute(dtoWithUpperCase);

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('TEST@EXAMPLE.COM');
      });

      it('should handle very long device info', async () => {
        const longDeviceInfo = 'A'.repeat(300);

        await useCase.execute(validDto, longDeviceInfo);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceInfo: longDeviceInfo,
          })
        );
      });

      it('should handle undefined device info', async () => {
        await useCase.execute(validDto, undefined);

        expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceInfo: null,
          })
        );
      });
    });

    describe('Method Call Order', () => {
      beforeEach(() => {
        mockUserRepository.findByEmail.mockResolvedValue(mockUser);
        mockPasswordHashService.compare.mockResolvedValue(true);
        mockJwtAuthService.generateAccessToken.mockReturnValue('access-token');
        mockJwtAuthService.generateRefreshToken.mockReturnValue('refresh-token');
        mockRefreshTokenRepository.save.mockResolvedValue({} as RefreshToken);
      });

      it('should find user before checking password', async () => {
        await useCase.execute(validDto);

        const findByEmailCall = mockUserRepository.findByEmail.mock.invocationCallOrder[0];
        const compareCall = mockPasswordHashService.compare.mock.invocationCallOrder[0];

        expect(findByEmailCall).toBeLessThan(compareCall);
      });

      it('should verify password before generating tokens', async () => {
        await useCase.execute(validDto);

        const compareCall = mockPasswordHashService.compare.mock.invocationCallOrder[0];
        const accessTokenCall = mockJwtAuthService.generateAccessToken.mock.invocationCallOrder[0];
        const refreshTokenCall = mockJwtAuthService.generateRefreshToken.mock.invocationCallOrder[0];

        expect(compareCall).toBeLessThan(accessTokenCall);
        expect(compareCall).toBeLessThan(refreshTokenCall);
      });

      it('should generate tokens before saving refresh token', async () => {
        await useCase.execute(validDto);

        const accessTokenCall = mockJwtAuthService.generateAccessToken.mock.invocationCallOrder[0];
        const refreshTokenCall = mockJwtAuthService.generateRefreshToken.mock.invocationCallOrder[0];
        const saveCall = mockRefreshTokenRepository.save.mock.invocationCallOrder[0];

        expect(accessTokenCall).toBeLessThan(saveCall);
        expect(refreshTokenCall).toBeLessThan(saveCall);
      });

      it('should not generate tokens if user not found', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockJwtAuthService.generateAccessToken).not.toHaveBeenCalled();
        expect(mockJwtAuthService.generateRefreshToken).not.toHaveBeenCalled();
      });

      it('should not generate tokens if password is invalid', async () => {
        mockPasswordHashService.compare.mockResolvedValue(false);

        await expect(useCase.execute(validDto)).rejects.toThrow();

        expect(mockJwtAuthService.generateAccessToken).not.toHaveBeenCalled();
        expect(mockJwtAuthService.generateRefreshToken).not.toHaveBeenCalled();
      });
    });
  });
});
